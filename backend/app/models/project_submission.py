from datetime import datetime, timezone
from typing import Optional, List
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ProjectSubmission(Document):
    event_id: PydanticObjectId
    team_id: PydanticObjectId
    
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    document_urls: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None, max_length=1500)
    
    submitted_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "project_submissions"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("team_id", ASCENDING)], unique=True),
        ]
