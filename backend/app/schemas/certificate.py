from datetime import datetime
from typing import Optional, List
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class CertificateGenerateRequest(BaseModel):
    registration_ids: Optional[List[PydanticObjectId]] = Field(default=None, description="Generate for select students, or all if empty")

class CertificateResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    registration_id: PydanticObjectId
    recipient_name: str
    certificate_hash: str
    file_url: Optional[str] = None
    is_revoked: bool
    issued_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
