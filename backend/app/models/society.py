from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Society(Document):
    name: str = Field(..., min_length=1, max_length=150)
    short_name: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = Field(default=None, max_length=1000)
    logo_url: Optional[str] = None
    theme_color: Optional[str] = Field(default="#2563EB", max_length=10)
    created_by_user_id: PydanticObjectId
    referral_code: Optional[str] = Field(default=None, max_length=50)
    
    # Extended fields for Organization Personal Space
    cover_banner_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    social_links: Optional[Dict[str, str]] = Field(default_factory=dict)
    gallery_urls: List[str] = Field(default_factory=list)
    documents: List[Dict[str, str]] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)
    
    is_archived: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "societies"
        use_state_holder = True
        indexes = [
            IndexModel([("name", ASCENDING)], unique=True),
            IndexModel([("short_name", ASCENDING)], unique=True),
            IndexModel([("referral_code", ASCENDING)]),
            IndexModel([("is_archived", ASCENDING)]),
        ]
