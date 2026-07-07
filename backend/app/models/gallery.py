from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Gallery(Document):
    event_id: PydanticObjectId
    media_url: str = Field(..., min_length=1)
    media_type: str = Field(default="image", max_length=20)  # e.g., "image", "video"
    uploaded_by_user_id: PydanticObjectId
    created_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    class Settings:
        name = "gallery"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
        ]
