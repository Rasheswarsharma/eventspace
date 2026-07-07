from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import TaskStatus, TaskPriority

class VolunteerTaskCreate(BaseModel):
    volunteer_user_id: PydanticObjectId
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class VolunteerTaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class VolunteerTaskResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    volunteer_user_id: PydanticObjectId
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    assigned_by_user_id: PydanticObjectId
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
