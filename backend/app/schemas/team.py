from datetime import datetime
from typing import List
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class TeamCreate(BaseModel):
    team_name: str = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class TeamJoin(BaseModel):
    invite_token: str = Field(..., min_length=8, max_length=64)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class TeamResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    team_name: str
    leader_registration_id: PydanticObjectId
    member_registration_ids: List[PydanticObjectId]
    invite_token: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
