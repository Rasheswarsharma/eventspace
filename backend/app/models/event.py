from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING
from app.models.enums import EventStatus

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Event(Document):
    society_id: PydanticObjectId
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=2000)
    date: datetime
    venue: str = Field(..., min_length=1, max_length=250)
    banner_url: Optional[str] = None
    cover_banner_url: Optional[str] = None
    status: EventStatus = Field(default=EventStatus.DRAFT)
    
    # Extended Event Details Page fields
    rules: List[str] = Field(default_factory=list)
    schedule: List[Dict[str, Any]] = Field(default_factory=list)
    speakers: List[Dict[str, Any]] = Field(default_factory=list)
    prizes: List[Dict[str, Any]] = Field(default_factory=list)
    sponsors: List[Dict[str, Any]] = Field(default_factory=list)
    gallery_urls: List[str] = Field(default_factory=list)
    faqs: List[Dict[str, str]] = Field(default_factory=list)
    
    # Active modules enabled for this event (e.g. ['registration', 'budget', 'certificates', 'judging'])
    active_modules: List[str] = Field(default_factory=list)
    
    registration_deadline: Optional[datetime] = None
    registration_capacity: Optional[int] = Field(default=None, ge=1)
    submission_deadline: Optional[datetime] = None
    
    # List of assigned Judge user IDs
    judges: List[PydanticObjectId] = Field(default_factory=list)
    
    # Dynamic form fields format: [{'name': 'github_url', 'label': 'GitHub Link', 'type': 'github_url', 'required': true}]
    registration_form_schema: List[Dict[str, Any]] = Field(default_factory=list)
    
    is_archived: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "events"
        use_state_holder = True
        indexes = [
            IndexModel([("society_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("date", ASCENDING)]),
            IndexModel([("is_archived", ASCENDING)]),
        ]
