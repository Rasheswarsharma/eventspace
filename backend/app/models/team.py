from datetime import datetime, timezone
from typing import List
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Team(Document):
    event_id: PydanticObjectId
    team_name: str = Field(..., min_length=1, max_length=100)
    leader_registration_id: PydanticObjectId
    member_registration_ids: List[PydanticObjectId] = Field(default_factory=list)
    invite_token: str = Field(..., min_length=8, max_length=64)
    
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "teams"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("event_id", ASCENDING), ("team_name", ASCENDING)], unique=True),
            IndexModel([("invite_token", ASCENDING)], unique=True),
        ]
