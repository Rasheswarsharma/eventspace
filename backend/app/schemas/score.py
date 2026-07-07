from datetime import datetime
from typing import Optional, Dict
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class ScoreCreate(BaseModel):
    team_id: PydanticObjectId
    criteria_scores: Dict[str, float] = Field(..., description="Key-value float ratings per criteria, e.g., {'design': 9.0}")
    comments: Optional[str] = Field(default=None, max_length=1000)

class ScoreResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    team_id: PydanticObjectId
    judge_user_id: PydanticObjectId
    criteria_scores: Dict[str, float]
    total_score: float
    comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
