import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.team import Team
from app.models.registration import Registration
from app.models.project_submission import ProjectSubmission
from app.models.enums import UserRole
from app.schemas.project_submission import ProjectSubmissionCreate, ProjectSubmissionResponse
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

logger = logging.getLogger("eventsphere.submissions")
router = APIRouter()

def validate_submission_payload(payload: ProjectSubmissionCreate):
    # GitHub URL validation
    if payload.github_url and "github.com" not in payload.github_url.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub URL must be a valid github.com link"
        )
        
    # Document extension validation
    allowed_extensions = {".pdf", ".zip", ".ppt", ".pptx", ".doc", ".docx"}
    for url in payload.document_urls:
        if not any(url.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document URL {url} must end with one of the allowed extensions: {', '.join(allowed_extensions)}"
            )

@router.post("/events/{event_id}/submissions", response_model=ProjectSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_project(
    event_id: PydanticObjectId,
    payload: ProjectSubmissionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Submits a project for a team. Enforces deadlines, validates inputs, and archives version history.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Enforce late submission lock
    if event.submission_deadline and datetime.now(timezone.utc) > event.submission_deadline.replace(tzinfo=timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission deadline has passed, late submissions are locked"
        )
        
    # Find user registration for this event
    user_reg = await Registration.find_one(
        Registration.event_id == event_id,
        Registration.user_id == current_user.id,
        Registration.is_cancelled == False
    )
    if not user_reg and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not registered for this event"
        )
        
    # Find user team for this event
    team = None
    if current_user.role != UserRole.SUPER_ADMIN:
        team = await Team.find_one(
            Team.event_id == event_id,
            (Team.leader_registration_id == user_reg.id) | (Team.member_registration_ids == user_reg.id)
        )
        if not team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must belong to a team to submit a project"
            )
    else:
        # Super admin submits on behalf of team specified in payload notes or just a placeholder
        # For simplicity in super admin workflows, we require a team context
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please use a student account affiliated with a team to submit"
        )

    # Validate URLs and documents
    validate_submission_payload(payload)

    # Look up existing submission
    submission = await ProjectSubmission.find_one(
        ProjectSubmission.event_id == event_id,
        ProjectSubmission.team_id == team.id
    )

    now = datetime.now(timezone.utc)
    if submission:
        # Save historical version
        history_entry = {
            "github_url": submission.github_url,
            "live_demo_url": submission.live_demo_url,
            "demo_video_url": submission.demo_video_url,
            "document_urls": submission.document_urls,
            "notes": submission.notes,
            "submitted_at": submission.submitted_at
        }
        submission.version_history.append(history_entry)
        
        # Update current submission
        submission.github_url = payload.github_url
        submission.live_demo_url = payload.live_demo_url
        submission.demo_video_url = payload.demo_video_url
        submission.document_urls = payload.document_urls
        submission.notes = payload.notes
        submission.updated_at = now
        await submission.save()
        
        action = "update_submission"
    else:
        # Create new submission
        submission = ProjectSubmission(
            event_id=event_id,
            team_id=team.id,
            github_url=payload.github_url,
            live_demo_url=payload.live_demo_url,
            demo_video_url=payload.demo_video_url,
            document_urls=payload.document_urls,
            notes=payload.notes,
            submitted_at=now,
            updated_at=now,
            version_history=[]
        )
        await submission.insert()
        action = "create_submission"

    await log_activity(
        actor_id=current_user.id,
        action=action,
        target_model="project_submissions",
        target_id=submission.id,
        changes_payload={"github_url": payload.github_url}
    )

    return submission

@router.get("/events/{event_id}/submissions/{team_id}", response_model=ProjectSubmissionResponse)
async def get_project_submission(
    event_id: PydanticObjectId,
    team_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the project submission and its version history for a team.
    """
    # Enforce organization/tenant check
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.EVENT_HOST, UserRole.COORDINATOR
        ])
    )
    
    # If not organizer, verify the student belongs to the queried team
    if not is_manager:
        user_reg = await Registration.find_one(
            Registration.event_id == event_id,
            Registration.user_id == current_user.id,
            Registration.is_cancelled == False
        )
        if not user_reg:
            raise HTTPException(status_code=403, detail="Access denied")
            
        team = await Team.get(team_id)
        if not team or (user_reg.id != team.leader_registration_id and user_reg.id not in team.member_registration_ids):
            raise HTTPException(status_code=403, detail="Access denied to this team's submission")

    submission = await ProjectSubmission.find_one(
        ProjectSubmission.event_id == event_id,
        ProjectSubmission.team_id == team_id
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Project submission not found")
        
    return submission
