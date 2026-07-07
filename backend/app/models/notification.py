from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Notification(Document):
    recipient_user_id: PydanticObjectId
    title: str = Field(..., min_length=1, max_length=150)
    message: str = Field(..., min_length=1, max_length=1000)
    type: str = Field(default="info", max_length=30)  # e.g., "info", "alert", "task", "budget"
    
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "notifications"
        use_state_holder = True
        indexes = [
            IndexModel([("recipient_user_id", ASCENDING)]),
            IndexModel([("is_read", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]
