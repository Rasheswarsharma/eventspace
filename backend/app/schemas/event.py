from datetime import datetime
from typing import Optional, List, Dict, Any
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import EventStatus

class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=2000)
    date: datetime
    venue: str = Field(..., min_length=1, max_length=250)
    banner_url: Optional[str] = None
    active_modules: List[str] = Field(default_factory=list)
    registration_deadline: Optional[datetime] = None
    registration_capacity: Optional[int] = Field(default=None, ge=1)
    judges: Optional[List[PydanticObjectId]] = Field(default_factory=list)
    registration_form_schema: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class EventUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=2000)
    date: Optional[datetime] = None
    venue: Optional[str] = Field(default=None, min_length=1, max_length=250)
    banner_url: Optional[str] = None
    status: Optional[EventStatus] = None
    active_modules: Optional[List[str]] = None
    registration_deadline: Optional[datetime] = None
    registration_capacity: Optional[int] = Field(default=None, ge=1)
    judges: Optional[List[PydanticObjectId]] = None
    registration_form_schema: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class EventResponse(BaseModel):
    id: PydanticObjectId
    society_id: PydanticObjectId
    name: str
    description: Optional[str] = None
    date: datetime
    venue: str
    banner_url: Optional[str] = None
    status: EventStatus
    active_modules: List[str]
    registration_deadline: Optional[datetime] = None
    registration_capacity: Optional[int] = None
    judges: List[PydanticObjectId] = Field(default_factory=list)
    registration_form_schema: List[Dict[str, Any]]
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
