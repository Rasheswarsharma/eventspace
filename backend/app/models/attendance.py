from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING
from app.models.enums import CheckInStatus

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Attendance(Document):
    event_id: PydanticObjectId
    registration_id: PydanticObjectId
    scanned_by_user_id: PydanticObjectId
    scanned_at: datetime = Field(default_factory=utc_now)
    scan_status: CheckInStatus = Field(default=CheckInStatus.PRESENT)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    class Settings:
        name = "attendance"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("registration_id", ASCENDING)]),
            IndexModel([("event_id", ASCENDING), ("registration_id", ASCENDING)], unique=True),
        ]
