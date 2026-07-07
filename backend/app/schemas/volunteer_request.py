from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class VolunteerRequestApply(BaseModel):
    department: Optional[str] = Field(default=None, max_length=100)
    team: Optional[str] = Field(default=None, max_length=100)
    duty: Optional[str] = Field(default=None, max_length=500)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class VolunteerRequestUpdateStatus(BaseModel):
    status: str = Field(..., description="Approved, Rejected, Waitlist")
    department: Optional[str] = Field(default=None, max_length=100)
    team: Optional[str] = Field(default=None, max_length=100)
    duty: Optional[str] = Field(default=None, max_length=500)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class VolunteerRequestResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    user_id: PydanticObjectId
    department: Optional[str] = None
    team: Optional[str] = None
    duty: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
