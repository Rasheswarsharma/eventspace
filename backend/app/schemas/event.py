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
    cover_banner_url: Optional[str] = None
    active_modules: List[str] = Field(default_factory=list)
    registration_deadline: Optional[datetime] = None
    registration_capacity: Optional[int] = Field(default=None, ge=1)
    judges: Optional[List[PydanticObjectId]] = Field(default_factory=list)
    registration_form_schema: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Extended Event details properties
    rules: Optional[List[str]] = Field(default_factory=list)
    schedule: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    speakers: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    prizes: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    sponsors: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    gallery_urls: Optional[List[str]] = Field(default_factory=list)
    faqs: Optional[List[Dict[str, str]]] = Field(default_factory=list)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class EventUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=2000)
    date: Optional[datetime] = None
    venue: Optional[str] = Field(default=None, min_length=1, max_length=250)
    banner_url: Optional[str] = None
    cover_banner_url: Optional[str] = None
    status: Optional[EventStatus] = None
    active_modules: Optional[List[str]] = None
    registration_deadline: Optional[datetime] = None
    registration_capacity: Optional[int] = Field(default=None, ge=1)
    judges: Optional[List[PydanticObjectId]] = None
    registration_form_schema: Optional[List[Dict[str, Any]]] = None
    
    # Extended Event details properties
    rules: Optional[List[str]] = None
    schedule: Optional[List[Dict[str, Any]]] = None
    speakers: Optional[List[Dict[str, Any]]] = None
    prizes: Optional[List[Dict[str, Any]]] = None
    sponsors: Optional[List[Dict[str, Any]]] = None
    gallery_urls: Optional[List[str]] = None
    faqs: Optional[List[Dict[str, str]]] = None

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
    cover_banner_url: Optional[str] = None
    status: EventStatus
    active_modules: List[str]
    registration_deadline: Optional[datetime] = None
    registration_capacity: Optional[int] = None
    judges: List[PydanticObjectId] = Field(default_factory=list)
    registration_form_schema: List[Dict[str, Any]]
    
    # Extended Event details properties
    rules: List[str] = []
    schedule: List[Dict[str, Any]] = []
    speakers: List[Dict[str, Any]] = []
    prizes: List[Dict[str, Any]] = []
    sponsors: List[Dict[str, Any]] = []
    gallery_urls: List[str] = []
    faqs: List[Dict[str, str]] = []
    
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
