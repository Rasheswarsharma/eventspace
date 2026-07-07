from datetime import datetime, timezone
from typing import Optional, Dict
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Feedback(Document):
    event_id: PydanticObjectId
    registration_id: Optional[PydanticObjectId] = None  # Nullable for anonymous feedback
    ratings: Dict[str, int] = Field(default_factory=dict)  # e.g., {"organization": 5, "content": 4}
    suggestions: Optional[str] = Field(default=None, max_length=1000)
    is_anonymous: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    class Settings:
        name = "feedback"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
        ]
