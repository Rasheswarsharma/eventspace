from datetime import datetime
from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    id: PydanticObjectId
    recipient_user_id: PydanticObjectId
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
