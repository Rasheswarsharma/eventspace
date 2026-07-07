from datetime import datetime
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class ChatMessageSend(BaseModel):
    message_text: str = Field(..., min_length=1, max_length=1000)

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

class ChatMessageResponse(BaseModel):
    id: PydanticObjectId
    channel_name: str
    sender_id: PydanticObjectId
    sender_name: str
    sender_role: str
    message_text: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
