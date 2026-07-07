from datetime import datetime
from typing import Optional, Dict, Any
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from app.models.enums import CheckInStatus

class RegistrationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    custom_fields_data: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class RegistrationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=10, max_length=15)
    custom_fields_data: Optional[Dict[str, Any]] = None
    check_in_status: Optional[CheckInStatus] = None
    is_cancelled: Optional[bool] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class RegistrationResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    user_id: Optional[PydanticObjectId] = None
    name: str
    email: EmailStr
    phone: str
    custom_fields_data: Dict[str, Any]
    qr_code_hash: str
    check_in_status: CheckInStatus
    waitlist_position: Optional[int] = None
    is_cancelled: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
