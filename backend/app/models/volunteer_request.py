from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class VolunteerRequest(Document):
    event_id: PydanticObjectId
    user_id: PydanticObjectId
    
    department: Optional[str] = Field(default=None, max_length=100)
    team: Optional[str] = Field(default=None, max_length=100)
    duty: Optional[str] = Field(default=None, max_length=500)
    
    # status: pending, approved, rejected, waitlist
    status: str = Field(default="pending", max_length=20)
    
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "volunteer_requests"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            # Compound index to prevent duplicate applications for the same event
            IndexModel([("event_id", ASCENDING), ("user_id", ASCENDING)], unique=True),
        ]
