from datetime import datetime
from typing import Optional, List, Dict, Any
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class SocietyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    short_name: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = Field(default=None, max_length=1000)
    logo_url: Optional[str] = None
    theme_color: Optional[str] = Field(default="#2563EB", max_length=10)
    cover_banner_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    gallery_urls: Optional[List[str]] = None
    documents: Optional[List[Dict[str, str]]] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class SocietyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    short_name: Optional[str] = Field(default=None, min_length=1, max_length=20)
    description: Optional[str] = Field(default=None, max_length=1000)
    logo_url: Optional[str] = None
    theme_color: Optional[str] = Field(default=None, max_length=10)
    cover_banner_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    gallery_urls: Optional[List[str]] = None
    documents: Optional[List[Dict[str, str]]] = None
    settings: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class SocietyResponse(BaseModel):
    id: PydanticObjectId
    name: str
    short_name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    theme_color: str
    created_by_user_id: PydanticObjectId
    referral_code: Optional[str] = None
    cover_banner_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    social_links: Optional[Dict[str, str]] = {}
    gallery_urls: List[str] = []
    documents: List[Dict[str, str]] = []
    settings: Dict[str, Any] = {}
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
