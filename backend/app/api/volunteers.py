from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.volunteer_request import VolunteerRequest
from app.models.volunteer_task import VolunteerTask
from app.models.enums import UserRole, TaskStatus
from app.schemas.volunteer_request import (
    VolunteerRequestApply,
    VolunteerRequestUpdateStatus,
    VolunteerRequestResponse
)
from app.schemas.volunteer_task import (
    VolunteerTaskCreate,
    VolunteerTaskUpdate,
    VolunteerTaskResponse
)
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

router = APIRouter()

@router.post("/events/{event_id}/volunteers/request", response_model=VolunteerRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_to_volunteer(
    event_id: PydanticObjectId,
    payload: VolunteerRequestApply,
    current_user: User = Depends(get_current_active_user)
):
    """
    Students apply to volunteer for an event.
    """
    event = await Event.find_one(Event.id == event_id, Event.is_archived == False)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # check if user has already requested
    existing = await VolunteerRequest.find_one(
        VolunteerRequest.event_id == event_id,
        VolunteerRequest.user_id == current_user.id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a volunteer request for this event"
        )
        
    req = VolunteerRequest(
        event_id=event_id,
        user_id=current_user.id,
        department=payload.department,
        team=payload.team,
        duty=payload.duty,
        status="pending"
    )
    await req.insert()
    return req

@router.get("/events/{event_id}/volunteers", response_model=List[VolunteerRequestResponse])
async def list_event_volunteers(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists volunteer requests and assignments for an event. Restricted to organizers.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # tenant check
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return await VolunteerRequest.find(VolunteerRequest.event_id == event_id).to_list()

@router.put("/volunteers/requests/{id}/status", response_model=VolunteerRequestResponse)
async def update_volunteer_request_status(
    id: PydanticObjectId,
    payload: VolunteerRequestUpdateStatus,
    current_user: User = Depends(get_current_active_user)
):
    """
    Approve, Reject, or Waitlist a volunteer request. Assigns department/team/duty.
    """
    req = await VolunteerRequest.get(id)
    if not req:
        raise HTTPException(status_code=404, detail="Volunteer request not found")
        
    event = await Event.get(req.event_id)
    # authorization check
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    req.status = payload.status.lower()
    if payload.department:
        req.department = payload.department
    if payload.team:
        req.team = payload.team
    if payload.duty:
        req.duty = payload.duty
        
    req.updated_at = datetime.now(timezone.utc)
    await req.save()
    
    # If approved, update user role to volunteer if they are currently a student
    if req.status == "approved":
        volunteer_user = await User.get(req.user_id)
        if volunteer_user and volunteer_user.role == UserRole.STUDENT:
            volunteer_user.role = UserRole.VOLUNTEER
            # Link user to society
            volunteer_user.society_id = event.society_id
            await volunteer_user.save()
            
    await log_activity(
        actor_id=current_user.id,
        action="update_volunteer_status",
        target_model="events",
        target_id=event.id,
        changes_payload={"request_id": str(id), "status": req.status}
    )
    return req

# Tasks operations
@router.post("/events/{event_id}/tasks", response_model=VolunteerTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer_task(
    event_id: PydanticObjectId,
    payload: VolunteerTaskCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates a new operational task and assigns it to a volunteer.
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
        
    # Check if the assigned volunteer is verified for this event
    vol_req = await VolunteerRequest.find_one(
        VolunteerRequest.event_id == event_id,
        VolunteerRequest.user_id == payload.volunteer_user_id,
        VolunteerRequest.status == "approved"
    )
    if not vol_req:
        raise HTTPException(status_code=400, detail="Assigned user is not an approved volunteer for this event")
        
    task = VolunteerTask(
        event_id=event_id,
        volunteer_user_id=payload.volunteer_user_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        assigned_by_user_id=current_user.id
    )
    await task.insert()
    
    await log_activity(
        actor_id=current_user.id,
        action="create_volunteer_task",
        target_model="events",
        target_id=event_id,
        changes_payload={"task_id": str(task.id), "title": task.title}
    )
    return task

@router.get("/events/{event_id}/tasks", response_model=List[VolunteerTaskResponse])
async def list_event_tasks(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists tasks for an event. Volunteers only see tasks assigned to them. Managers see all.
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
    
    if is_manager:
        return await VolunteerTask.find(VolunteerTask.event_id == event_id).to_list()
        
    # If volunteer, only return their own tasks
    return await VolunteerTask.find(
        VolunteerTask.event_id == event_id,
        VolunteerTask.volunteer_user_id == current_user.id
    ).to_list()

@router.put("/tasks/{id}", response_model=VolunteerTaskResponse)
async def update_task(
    id: PydanticObjectId,
    payload: VolunteerTaskUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates a task. Volunteers can toggle status, managers can edit everything.
    """
    task = await VolunteerTask.get(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    event = await Event.get(task.event_id)
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    is_assigned_volunteer = task.volunteer_user_id == current_user.id
    
    if not (is_manager or is_assigned_volunteer):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    if is_manager:
        # Full edit rights
        update_dict = payload.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            setattr(task, k, v)
    else:
        # Volunteer can only toggle status
        if payload.status:
            task.status = payload.status
            
    if task.status == TaskStatus.COMPLETED and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)
    elif task.status != TaskStatus.COMPLETED:
        task.completed_at = None
        
    task.updated_at = datetime.now(timezone.utc)
    await task.save()
    return task

@router.delete("/tasks/{id}", status_code=status.HTTP_200_OK)
async def delete_task(
    id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes a volunteer task. Restricted to managers.
    """
    task = await VolunteerTask.get(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    event = await Event.get(task.event_id)
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    await task.delete()
    return {"message": "Task successfully deleted"}
