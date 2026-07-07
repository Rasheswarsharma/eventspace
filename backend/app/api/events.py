from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.audit_log import AuditLog
from app.models.enums import UserRole, EventStatus
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.core.dependencies import get_current_active_user, require_roles
from app.utils.audit import log_activity

router = APIRouter()

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    request: Request,
    society_id: PydanticObjectId = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates a new event under a society. Authorized for Super Admins, or Society Presidents/Admins of that society.
    """
    is_president_admin = (
        current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.ORGANIZATION_ADMIN] 
        and current_user.society_id == society_id
    )
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    
    if not (is_super_admin or is_president_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create events for this society"
        )
        
    event = Event(
        society_id=society_id,
        name=payload.name,
        description=payload.description,
        date=payload.date,
        venue=payload.venue,
        banner_url=payload.banner_url,
        active_modules=payload.active_modules,
        registration_deadline=payload.registration_deadline,
        registration_capacity=payload.registration_capacity,
        registration_form_schema=payload.registration_form_schema
    )
    await event.insert()
    
    # Audit log
    await log_activity(
        actor_id=current_user.id,
        action="create_event",
        target_model="events",
        target_id=event.id,
        changes_payload={"name": event.name},
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )
    return event

@router.get("/", response_model=List[EventResponse])
async def list_events(
    society_id: Optional[PydanticObjectId] = None,
    status_filter: Optional[EventStatus] = None
):
    """
    List events. Open to all users (for public discovery). Can filter by society or status.
    """
    query = {"is_archived": False}
    if society_id:
        query["society_id"] = society_id
    if status_filter:
        query["status"] = status_filter
        
    return await Event.find(query).to_list()

@router.get("/{id}", response_model=EventResponse)
async def get_event(id: PydanticObjectId):
    """
    Get event details by ID.
    """
    event = await Event.find_one(Event.id == id, Event.is_archived == False)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or archived"
        )
    return event

@router.put("/{id}", response_model=EventResponse)
async def update_event(
    id: PydanticObjectId,
    payload: EventUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates event configurations. Restricted to Super Admin or Society managers.
    """
    event = await Event.find_one(Event.id == id, Event.is_archived == False)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
        
    is_manager = (
        current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.EVENT_HOST]
        and current_user.society_id == event.society_id
    )
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    if not (is_super_admin or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this event"
        )
        
    update_dict = payload.model_dump(exclude_unset=True)
    if not update_dict:
        return event
        
    for k, v in update_dict.items():
        setattr(event, k, v)
        
    event.updated_at = datetime.now(timezone.utc)
    await event.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="update_event",
        target_model="events",
        target_id=event.id,
        changes_payload=update_dict,
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )
    return event

@router.put("/{id}/status", response_model=EventResponse)
async def update_event_status(
    id: PydanticObjectId,
    request: Request,
    status_val: EventStatus = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates event status/lifecycle step.
    """
    event = await Event.find_one(Event.id == id, Event.is_archived == False)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
        
    is_manager = (
        current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.EVENT_HOST]
        and current_user.society_id == event.society_id
    )
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    if not (is_super_admin or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
        
    old_status = event.status
    event.status = status_val
    event.updated_at = datetime.now(timezone.utc)
    await event.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="change_event_status",
        target_model="events",
        target_id=event.id,
        changes_payload={"old_status": old_status, "new_status": status_val},
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )
    return event

@router.get("/{id}/timeline")
async def get_event_timeline(
    id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the activity log/timeline tracking for the event. Accessible to society organizers.
    """
    event = await Event.get(id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Check tenant boundary
    is_manager = (
        current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.EVENT_HOST, UserRole.VOLUNTEER]
        and current_user.society_id == event.society_id
    )
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    if not (is_super_admin or is_manager):
        raise HTTPException(status_code=403, detail="Access denied")
        
    # Retrieve audit logs sorted by desc timestamp
    logs = await AuditLog.find(
        AuditLog.target_id == id
    ).sort("-timestamp").to_list()
    
    return logs

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_event(
    id: PydanticObjectId,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Soft deletes/archives an event. Authorized for Super Admins or Society Presidents.
    """
    event = await Event.get(id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
        
    is_president = (
        current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.ORGANIZATION_ADMIN] 
        and current_user.society_id == event.society_id
    )
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    if not (is_super_admin or is_president):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this event"
        )
        
    event.is_archived = True
    await event.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="delete_event",
        target_model="events",
        target_id=event.id,
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )
    return {"message": "Event successfully archived"}
