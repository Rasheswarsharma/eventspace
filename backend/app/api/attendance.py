from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.models.enums import UserRole, CheckInStatus
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

router = APIRouter()

@router.post("/events/{event_id}/attendance/scan", status_code=status.HTTP_200_OK)
async def scan_qr_ticket(
    event_id: PydanticObjectId,
    qr_code_hash: str = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Scans a QR code ticket, logs the entry, and checks single-use constraints. Volunteer/Manager only.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Check permissions
    is_authorized = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST, UserRole.VOLUNTEER
        ])
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Unauthorized check-in permission")
        
    registration = await Registration.find_one(
        Registration.event_id == event_id,
        Registration.qr_code_hash == qr_code_hash,
        Registration.is_cancelled == False
    )
    if not registration:
        raise HTTPException(status_code=400, detail="Invalid QR ticket or registration cancelled")
        
    # Enforce single-use constraint
    if registration.check_in_status != CheckInStatus.ABSENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ticket has already been scanned! Check-in status: {registration.check_in_status.value.upper()}"
        )
        
    registration.check_in_status = CheckInStatus.PRESENT
    registration.updated_at = datetime.now(timezone.utc)
    await registration.save()
    
    # Save check-in log
    att = Attendance(
        event_id=event_id,
        registration_id=registration.id,
        scanned_by_user_id=current_user.id,
        scan_status=CheckInStatus.PRESENT
    )
    await att.insert()
    
    await log_activity(
        actor_id=current_user.id,
        action="qr_check_in",
        target_model="events",
        target_id=event_id,
        changes_payload={"registration_id": str(registration.id), "student": registration.name}
    )
    
    return {
        "message": "Check-in successful",
        "student_name": registration.name,
        "email": registration.email,
        "check_in_time": att.scanned_at
    }

@router.post("/events/{event_id}/attendance/manual", status_code=status.HTTP_200_OK)
async def manual_check_in(
    event_id: PydanticObjectId,
    registration_id: PydanticObjectId,
    status_val: CheckInStatus = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Manually overrides check-in status for a participant. restricted to event managers.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    registration = await Registration.find_one(
        Registration.id == registration_id,
        Registration.event_id == event_id,
        Registration.is_cancelled == False
    )
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    old_status = registration.check_in_status
    registration.check_in_status = status_val
    registration.updated_at = datetime.now(timezone.utc)
    await registration.save()
    
    # Update or insert Attendance entry log
    att = await Attendance.find_one(
        Attendance.event_id == event_id,
        Attendance.registration_id == registration_id
    )
    if att:
        att.scan_status = status_val
        att.scanned_by_user_id = current_user.id
        att.scanned_at = datetime.now(timezone.utc)
        await att.save()
    else:
        att = Attendance(
            event_id=event_id,
            registration_id=registration_id,
            scanned_by_user_id=current_user.id,
            scan_status=status_val
        )
        await att.insert()
        
    await log_activity(
        actor_id=current_user.id,
        action="manual_check_in",
        target_model="events",
        target_id=event_id,
        changes_payload={
            "registration_id": str(registration_id),
            "old_status": old_status.value,
            "new_status": status_val.value
        }
    )
    return {"message": "Attendance status updated manually", "new_status": status_val.value}

@router.get("/events/{event_id}/attendance/logs")
async def get_attendance_logs(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the check-in history logs for this event. Restricted to managers.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST, UserRole.VOLUNTEER
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    logs = await Attendance.find(Attendance.event_id == event_id).sort("-scanned_at").to_list()
    # Map logs with registration details
    result = []
    for log in logs:
        reg = await Registration.get(log.registration_id)
        scanner = await User.get(log.scanned_by_user_id)
        result.append({
            "id": str(log.id),
            "student_name": reg.name if reg else "Unknown",
            "email": reg.email if reg else "Unknown",
            "scanned_by": scanner.full_name if scanner else "Unknown",
            "scanned_at": log.scanned_at,
            "status": log.scan_status
        })
    return result

@router.get("/events/{event_id}/attendance/analytics")
async def get_attendance_analytics(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns attendance metrics: Present vs Absent count, timeline distribution of entries.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    total_registrations = await Registration.find(
        Registration.event_id == event_id,
        Registration.is_cancelled == False
    ).count()
    
    present_count = await Registration.find(
        Registration.event_id == event_id,
        Registration.is_cancelled == False,
        Registration.check_in_status == CheckInStatus.PRESENT
    ).count()
    
    late_count = await Registration.find(
        Registration.event_id == event_id,
        Registration.is_cancelled == False,
        Registration.check_in_status == CheckInStatus.LATE
    ).count()
    
    absent_count = total_registrations - present_count - late_count
    
    ratio = (present_count + late_count) / total_registrations if total_registrations > 0 else 0.0
    
    return {
        "total_registered": total_registrations,
        "present_count": present_count,
        "late_count": late_count,
        "absent_count": absent_count,
        "attendance_ratio": round(ratio * 100, 2)
    }
