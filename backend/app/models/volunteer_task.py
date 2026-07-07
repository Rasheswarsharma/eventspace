from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING
from app.models.enums import TaskStatus, TaskPriority

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class VolunteerTask(Document):
    event_id: PydanticObjectId
    volunteer_user_id: PydanticObjectId
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    assigned_by_user_id: PydanticObjectId
    
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "volunteer_tasks"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("volunteer_user_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
        ]
