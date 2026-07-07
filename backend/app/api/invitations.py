import secrets
from typing import List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId
from app.models.user import User
from app.models.invitation import Invitation
from app.models.enums import UserRole, InvitationStatus
from app.schemas.invitation import InvitationCreate, InvitationResponse
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

router = APIRouter()

@router.post("/", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    payload: InvitationCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates an onboarding invitation token. Society President can invite Society Admins,
    Volunteers, Judges, Faculty Coordinators, and Event Hosts.
    """
    # Permission verification
    is_president = current_user.role == UserRole.SOCIETY_PRESIDENT and current_user.society_id == payload.society_id
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    
    if not (is_super_admin or is_president):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to invite users for this society tenant"
        )
        
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    invite = Invitation(
        society_id=payload.society_id,
        email=payload.email,
        role=payload.role,
        token=token,
        status=InvitationStatus.PENDING,
        invited_by_user_id=current_user.id,
        expires_at=expires_at
    )
    await invite.insert()
    
    import logging
    logger = logging.getLogger("eventsphere.invitation")
    logger.info(f"MOCK INVITATION LINK dispatched to {payload.email}: http://localhost:3000/register?token={token}")
    
    await log_activity(
        actor_id=current_user.id,
        action="create_invitation",
        target_model="invitations",
        target_id=invite.id,
        changes_payload={"email": payload.email, "role": payload.role.value}
    )
    return invite

@router.get("/", response_model=List[InvitationResponse])
async def list_invitations(
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists invitations. Restricted to managers.
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        return await Invitation.all().to_list()
        
    is_manager = current_user.role in [UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN]
    if is_manager:
        return await Invitation.find(Invitation.society_id == current_user.society_id).to_list()
        
    raise HTTPException(status_code=403, detail="Access denied")

@router.get("/verify")
async def verify_invitation_token(token: str = Query(...)):
    """
    Verifies an invitation token and returns its details.
    """
    invite = await Invitation.find_one(
        Invitation.token == token,
        Invitation.status == InvitationStatus.PENDING,
        Invitation.expires_at > datetime.now(timezone.utc)
    )
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation link is invalid or expired"
        )
        
    return {
        "email": invite.email,
        "role": invite.role,
        "society_id": str(invite.society_id) if invite.society_id else None
    }

@router.post("/claim")
async def claim_invitation_token(
    token: str = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Claims/accepts an invitation, promoting the logged-in user to the invited role.
    """
    invite = await Invitation.find_one(
        Invitation.token == token,
        Invitation.status == InvitationStatus.PENDING,
        Invitation.expires_at > datetime.now(timezone.utc)
    )
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation link is invalid or expired"
        )
        
    if current_user.email != invite.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation token was issued for a different email address"
        )
        
    # Promote user
    current_user.role = invite.role
    current_user.society_id = invite.society_id
    await current_user.save()
    
    invite.status = InvitationStatus.ACCEPTED
    invite.updated_at = datetime.now(timezone.utc)
    await invite.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="claim_invitation",
        target_model="users",
        target_id=current_user.id,
        changes_payload={"role": invite.role.value, "society_id": str(invite.society_id) if invite.society_id else None}
    )
    
    return {"message": f"Successfully onboarded! You are now a {invite.role.value.upper()}"}
