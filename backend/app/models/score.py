from datetime import datetime, timezone
from typing import Optional, Dict
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Score(Document):
    event_id: PydanticObjectId
    team_id: PydanticObjectId
    judge_user_id: PydanticObjectId
    
    # Key-value scores: {"innovation": 8.5, "ui_ux": 9.0, "technical_complexity": 7.5}
    criteria_scores: Dict[str, float] = Field(default_factory=dict)
    total_score: float = Field(default=0.0)
    comments: Optional[str] = Field(default=None, max_length=1000)
    is_finalized: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    class Settings:
        name = "scores"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)]),
            IndexModel([("team_id", ASCENDING)]),
            IndexModel([("judge_user_id", ASCENDING)]),
            # Compound index to ensure a judge scores a team exactly once
            IndexModel([("event_id", ASCENDING), ("team_id", ASCENDING), ("judge_user_id", ASCENDING)], unique=True),
        ]
