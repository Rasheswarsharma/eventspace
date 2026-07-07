from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict, EmailStr
from pymongo import IndexModel, ASCENDING
from app.models.enums import UserRole, InvitationStatus

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Invitation(Document):
    society_id: Optional[PydanticObjectId] = None  # Can be null for global faculty/admin invitations
    email: EmailStr
    role: UserRole
    token: str = Field(..., min_length=8, max_length=64)
    status: InvitationStatus = Field(default=InvitationStatus.PENDING)
    
    invited_by_user_id: PydanticObjectId
    expires_at: datetime
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "invitations"
        use_state_holder = True
        indexes = [
            IndexModel([("email", ASCENDING)]),
            IndexModel([("token", ASCENDING)], unique=True),
            IndexModel([("status", ASCENDING)]),
        ]
