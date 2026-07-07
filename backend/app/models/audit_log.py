from datetime import datetime, timezone
from typing import Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, DESCENDING, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AuditLog(Document):
    actor_user_id: Optional[PydanticObjectId] = None  # Null for system actions
    action: str = Field(..., min_length=1)  # e.g., "create_event", "approve_budget"
    target_model: str = Field(..., min_length=1)  # e.g., "events", "budgets"
    target_id: Optional[PydanticObjectId] = None
    
    changes_payload: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    class Settings:
        name = "audit_logs"
        use_state_holder = True
        indexes = [
            IndexModel([("actor_user_id", ASCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
        ]
