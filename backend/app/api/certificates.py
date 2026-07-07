import hashlib
import secrets
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.certificate import Certificate
from app.models.enums import UserRole, CheckInStatus
from app.schemas.certificate import CertificateGenerateRequest, CertificateResponse
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

router = APIRouter()

@router.post("/events/{event_id}/certificates/generate", response_model=List[CertificateResponse], status_code=status.HTTP_201_CREATED)
async def generate_event_certificates(
    event_id: PydanticObjectId,
    payload: CertificateGenerateRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generates certificates for event participants (bulk or individual). Restricted to society admins.
    Only users who checked in (present or late) receive certificates.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    # Get registrations to generate for
    query: dict = {
        "event_id": event_id,
        "is_cancelled": False,
        "check_in_status": {"$in": [CheckInStatus.PRESENT, CheckInStatus.LATE]}
    }
    
    if payload.registration_ids:
        query["_id"] = {"$in": payload.registration_ids}
        
    registrations = await Registration.find(query).to_list()
    if not registrations:
        raise HTTPException(status_code=400, detail="No eligible checked-in participants found for certificate generation")
        
    generated_certs = []
    for reg in registrations:
        # Check if certificate already exists
        existing = await Certificate.find_one(Certificate.registration_id == reg.id)
        if existing:
            generated_certs.append(existing)
            continue
            
        # Generate unique verification hash
        hash_src = f"ES-CERT-{reg.id}-{secrets.token_hex(4)}"
        cert_hash = hashlib.sha256(hash_src.encode("utf-8")).hexdigest()[:16].upper()
        
        # Simulated Cloudinary PDF URL
        file_url = f"https://res.cloudinary.com/eventsphere/image/upload/v1700000000/certificates/{cert_hash}.pdf"
        
        cert = Certificate(
            event_id=event_id,
            registration_id=reg.id,
            recipient_name=reg.name,
            certificate_hash=cert_hash,
            file_url=file_url
        )
        await cert.insert()
        generated_certs.append(cert)
        
    await log_activity(
        actor_id=current_user.id,
        action="generate_certificates",
        target_model="events",
        target_id=event_id,
        changes_payload={"count": len(generated_certs)},
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return generated_certs

@router.get("/events/{event_id}/certificates", response_model=List[CertificateResponse])
async def list_event_certificates(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists all certificates generated for an event.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Tenant boundary
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    return await Certificate.find(Certificate.event_id == event_id).to_list()

@router.get("/certificates/verify")
async def verify_certificate(hash_val: str = Query(...)):
    """
    Public lookup verification endpoint. Anyone can verify a credential by inputting its hash.
    """
    cert = await Certificate.find_one(Certificate.certificate_hash == hash_val.upper())
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found in registry")
        
    if cert.is_revoked:
        raise HTTPException(status_code=400, detail="This certificate has been revoked by the institution")
        
    event = await Event.get(cert.event_id)
    reg = await Registration.get(cert.registration_id)
    
    return {
        "status": "verified",
        "recipient_name": cert.recipient_name,
        "event_name": event.name if event else "Unknown Event",
        "date_issued": cert.issued_at,
        "verification_hash": cert.certificate_hash,
        "download_url": cert.file_url,
        "email": reg.email if reg else None
    }

@router.get("/registrations/{registration_id}/certificate", response_model=CertificateResponse)
async def get_registration_certificate(
    registration_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the generated certificate for a specific registration.
    Accessible to the participant themselves or managers.
    """
    reg = await Registration.get(registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    event = await Event.get(reg.event_id)
    is_owner = current_user.id == reg.user_id or current_user.email == reg.email
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not (is_owner or is_manager):
        raise HTTPException(status_code=403, detail="Access denied")
        
    cert = await Certificate.find_one(Certificate.registration_id == registration_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not yet generated for this participant")
        
    return cert
