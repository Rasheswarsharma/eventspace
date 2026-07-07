from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Certificate(Document):
    event_id: PydanticObjectId
    registration_id: PydanticObjectId
    recipient_name: str = Field(..., min_length=1, max_length=150)
    
    # SHA-256 or random unique string for lookup verification URL: e.g. /verify?hash=...
    certificate_hash: str = Field(..., min_length=10, max_length=64)
    file_url: Optional[str] = None
    
    is_revoked: bool = Field(default=False)
    issued_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "certificates"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("registration_id", ASCENDING)], unique=True),
            IndexModel([("certificate_hash", ASCENDING)], unique=True),
        ]
