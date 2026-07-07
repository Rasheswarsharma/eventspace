from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ChatMessage(Document):
    channel_name: str = Field(..., min_length=1, max_length=100)  # e.g., "event_123_general", "society_456_volunteers"
    sender_id: PydanticObjectId
    sender_name: str = Field(..., min_length=1, max_length=100)
    sender_role: str = Field(..., min_length=1, max_length=50)
    message_text: str = Field(..., min_length=1, max_length=1000)
    
    created_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "chat_messages"
        use_state_holder = True
        indexes = [
            IndexModel([("channel_name", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]
