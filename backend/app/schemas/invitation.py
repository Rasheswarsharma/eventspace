from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from app.models.enums import UserRole, InvitationStatus

class InvitationCreate(BaseModel):
    email: EmailStr
    role: UserRole
    society_id: Optional[PydanticObjectId] = None

class InvitationResponse(BaseModel):
    id: PydanticObjectId
    society_id: Optional[PydanticObjectId] = None
    email: EmailStr
    role: UserRole
    token: str
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
