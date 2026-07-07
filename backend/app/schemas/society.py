from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class SocietyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    short_name: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = Field(default=None, max_length=1000)
    logo_url: Optional[str] = None
    theme_color: Optional[str] = Field(default="#2563EB", max_length=10)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class SocietyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    short_name: Optional[str] = Field(default=None, min_length=1, max_length=20)
    description: Optional[str] = Field(default=None, max_length=1000)
    logo_url: Optional[str] = None
    theme_color: Optional[str] = Field(default=None, max_length=10)

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
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
