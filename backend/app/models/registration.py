from datetime import datetime, timezone
from typing import Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict, EmailStr
from pymongo import IndexModel, ASCENDING
from app.models.enums import CheckInStatus

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Registration(Document):
    event_id: PydanticObjectId
    user_id: Optional[PydanticObjectId] = None  # Link to registered user if exists
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    
    # Polymorphic response data matching the event's form builder schema
    custom_fields_data: Dict[str, Any] = Field(default_factory=dict)
    
    qr_code_hash: str = Field(..., min_length=8, max_length=128)
    check_in_status: CheckInStatus = Field(default=CheckInStatus.ABSENT)
    
    waitlist_position: Optional[int] = None
    is_cancelled: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "registrations"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING)]),
            # Compound unique index to prevent duplicate user registration for the same event
            IndexModel([("event_id", ASCENDING), ("email", ASCENDING)], unique=True),
            # Unique index for QR code hash to scan tickets quickly
            IndexModel([("qr_code_hash", ASCENDING)], unique=True),
            IndexModel([("is_cancelled", ASCENDING)]),
        ]
