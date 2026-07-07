import hashlib
import secrets
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.enums import UserRole, EventStatus, CheckInStatus
from app.schemas.registration import RegistrationCreate, RegistrationUpdate, RegistrationResponse
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

router = APIRouter()

@router.post("/events/{event_id}/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_for_event(
    event_id: PydanticObjectId,
    payload: RegistrationCreate,
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    Registers a participant for an event. Performs capacity, deadline, and validation checks.
    """
    event = await Event.find_one(Event.id == event_id, Event.is_archived == False)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # check status
    if event.status != EventStatus.REGISTRATION_OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is not open for this event"
        )
        
    # check deadline
    if event.registration_deadline and event.registration_deadline.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline has passed"
        )
        
    # check duplicate
    existing = await Registration.find_one(
        Registration.event_id == event_id,
        Registration.email == payload.email,
        Registration.is_cancelled == False
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already registered for this event"
        )
        
    # validate dynamic fields
    # check if required fields are provided
    schema_fields = {field["name"]: field for field in event.registration_form_schema}
    for field_name, field_def in schema_fields.items():
        if field_def.get("required") and field_name not in payload.custom_fields_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field_def.get('label', field_name)}"
            )
            
    # check capacity
    total_active_regs = await Registration.find(
        Registration.event_id == event_id,
        Registration.is_cancelled == False,
        Registration.waitlist_position == None
    ).count()
    
    waitlist_pos = None
    if event.registration_capacity and total_active_regs >= event.registration_capacity:
        # Get next waitlist number
        last_waitlisted = await Registration.find(
            Registration.event_id == event_id,
            Registration.is_cancelled == False,
            Registration.waitlist_position != None
        ).sort("-waitlist_position").first_or_none()
        
        waitlist_pos = (last_waitlisted.waitlist_position + 1) if last_waitlisted else 1
        
    # generate unique QR hash
    token_source = f"{payload.email}-{event_id}-{secrets.token_hex(8)}"
    qr_hash = hashlib.sha256(token_source.encode("utf-8")).hexdigest()[:24].upper()
    
    registration = Registration(
        event_id=event_id,
        user_id=current_user.id if current_user else None,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        custom_fields_data=payload.custom_fields_data,
        qr_code_hash=qr_hash,
        check_in_status=CheckInStatus.ABSENT,
        waitlist_position=waitlist_pos
    )
    await registration.insert()
    
    await log_activity(
        actor_id=current_user.id if current_user else None,
        action="participant_register",
        target_model="events",
        target_id=event_id,
        changes_payload={"email": payload.email, "waitlist": waitlist_pos is not None}
    )
    
    return registration

@router.get("/events/{event_id}/registrations", response_model=List[RegistrationResponse])
async def list_event_registrations(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists registrations for an event. Restricted to organizers.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.EVENT_HOST, UserRole.VOLUNTEER]
        and current_user.society_id == event.society_id
    )
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    if not (is_super_admin or is_manager):
        raise HTTPException(status_code=403, detail="Permission denied")
        
    return await Registration.find(Registration.event_id == event_id).to_list()

@router.put("/registrations/{id}/cancel", response_model=RegistrationResponse)
async def cancel_registration(
    id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancels a user's registration and promotes the first person in the waitlist if applicable.
    """
    registration = await Registration.get(id)
    if not registration or registration.is_cancelled:
        raise HTTPException(status_code=404, detail="Active registration not found")
        
    # check permission (either the user themselves, or the event manager)
    event = await Event.get(registration.event_id)
    is_owner = current_user.id == registration.user_id or current_user.email == registration.email
    is_manager = (
        current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.EVENT_HOST]
        and current_user.society_id == event.society_id
    )
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    
    if not (is_owner or is_manager or is_super_admin):
        raise HTTPException(status_code=403, detail="Unauthorized to cancel this registration")
        
    was_active = registration.waitlist_position is None
    registration.is_cancelled = True
    registration.waitlist_position = None
    await registration.save()
    
    # If the cancelled registration was active, pull the first waitlisted student up
    if was_active:
        first_waitlist = await Registration.find(
            Registration.event_id == event.id,
            Registration.is_cancelled == False,
            Registration.waitlist_position != None
        ).sort("waitlist_position").first_or_none()
        
        if first_waitlist:
            first_waitlist.waitlist_position = None
            await first_waitlist.save()
            # Log promotion
            await log_activity(
                actor_id=None,
                action="waitlist_promote",
                target_model="events",
                target_id=event.id,
                changes_payload={"email": first_waitlist.email}
            )
            
            # Recalculate remaining waitlist positions
            waitlisted_regs = await Registration.find(
                Registration.event_id == event.id,
                Registration.is_cancelled == False,
                Registration.waitlist_position != None
            ).sort("waitlist_position").to_list()
            
            for idx, reg in enumerate(waitlisted_regs):
                reg.waitlist_position = idx + 1
                await reg.save()
                
    await log_activity(
        actor_id=current_user.id,
        action="registration_cancelled",
        target_model="events",
        target_id=event.id,
        changes_payload={"email": registration.email}
    )
    
    return registration
