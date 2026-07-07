from datetime import datetime
from typing import Optional, List, Dict, Any
from beanie import PydanticObjectId
from pydantic import BaseModel, Field, ConfigDict

class BudgetCreate(BaseModel):
    total_allocation: float = Field(..., ge=0.0)

class BudgetTransactionCreate(BaseModel):
    # type can be "income" or "expense"
    transaction_type: str = Field(..., description="Either 'income' or 'expense'")
    source_or_category: str = Field(..., min_length=1, max_length=150, description="Income source or expense category")
    description: Optional[str] = Field(default=None, max_length=500)
    amount: float = Field(..., gt=0.0)
    receipt_url: Optional[str] = None

class BudgetResponse(BaseModel):
    id: PydanticObjectId
    event_id: PydanticObjectId
    total_allocation: float
    incomes: List[Dict[str, Any]]
    expenses: List[Dict[str, Any]]
    remaining_balance: float
    last_updated_by_user_id: PydanticObjectId
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
