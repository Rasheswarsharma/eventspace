import re
from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from app.models.enums import UserRole

# Reusable field definitions
PASSWORD_FIELD = Field(..., min_length=8, max_length=128, description="Password must be between 8 and 128 characters.")
PHONE_FIELD = Field(default=None, min_length=10, max_length=15, description="Phone number with length between 10 and 15.")

def check_phone_format(v: Optional[str]) -> Optional[str]:
    """Helper validator to check standard international phone syntax."""
    if v is None:
        return v
    if not re.match(r"^\+?[0-9\-\s]+$", v):
        raise ValueError("Phone number must contain only digits, an optional leading '+', dashes, or spaces.")
    return v

class UserCreate(BaseModel):
    """Schema for student/organizer registration payloads."""
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = PASSWORD_FIELD
    phone: Optional[str] = PHONE_FIELD
    society_id: Optional[PydanticObjectId] = None
    college: Optional[str] = Field(default=None, max_length=150)
    role: Optional[UserRole] = Field(default=UserRole.STUDENT)
    referral_code: Optional[str] = Field(default=None, max_length=50)
    invite_token: Optional[str] = Field(default=None, max_length=128)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        return check_phone_format(v)

class UserLogin(BaseModel):
    """Schema for credentials login requests."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserUpdate(BaseModel):
    """Schema for standard user profile updates."""
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = PHONE_FIELD
    profile_image_url: Optional[str] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        return check_phone_format(v)

class UserResponse(BaseModel):
    """Public user profile data returned by application endpoints."""
    id: PydanticObjectId
    full_name: str
    email: EmailStr
    role: UserRole
    society_id: Optional[PydanticObjectId] = None
    profile_image_url: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

class ChangePasswordRequest(BaseModel):
    """Schema for active users updating their login password."""
    old_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = PASSWORD_FIELD

class PasswordResetRequest(BaseModel):
    """Schema for requesting a password recovery reset token."""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Schema for resetting password using a recovery reset token."""
    token: str = Field(..., min_length=1, description="Recovery token sent to user email.")
    new_password: str = PASSWORD_FIELD

class RoleUpdate(BaseModel):
    """Schema for updating a user's role (Super Admin only)."""
    user_id: PydanticObjectId
    role: UserRole
