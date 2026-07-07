from datetime import datetime
from typing import Optional, List
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict, HttpUrl

class ProjectSubmissionCreate(BaseModel):
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    document_urls: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None, max_length=1500)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class ProjectSubmissionResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    team_id: PydanticObjectId
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    document_urls: List[str]
    notes: Optional[str] = None
    submitted_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
