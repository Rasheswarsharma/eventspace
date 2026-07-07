from datetime import datetime, timezone
from typing import List, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Budget(Document):
    event_id: PydanticObjectId
    total_allocation: float = Field(default=0.0, ge=0.0)
    
    # List of incomes, each format: {"source": "Sponsor X", "amount": 15000.0, "status": "Approved"/"Pending", "created_at": datetime}
    incomes: List[Dict[str, Any]] = Field(default_factory=list)
    
    # List of expenses, each format: {"category": "AV Equipment", "description": "Sound rent", "amount": 5000.0, "status": "Approved"/"Pending", "receipt_url": "...", "created_at": datetime}
    expenses: List[Dict[str, Any]] = Field(default_factory=list)
    
    last_updated_by_user_id: PydanticObjectId
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    class Settings:
        name = "budgets"
        use_state_holder = True
        indexes = [
            IndexModel([("event_id", ASCENDING)], unique=True),
        ]
