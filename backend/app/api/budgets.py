import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.budget import Budget
from app.models.enums import UserRole
from app.schemas.budget import BudgetCreate, BudgetTransactionCreate, BudgetResponse
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

router = APIRouter()

def calculate_remaining_balance(budget: Budget) -> float:
    """
    Helper to calculate remaining balance.
    Remaining = Total Allocation + Approved Incomes - Approved Expenses
    """
    total_income = sum(item["amount"] for item in budget.incomes if item["status"] == "Approved")
    total_expense = sum(item["amount"] for item in budget.expenses if item["status"] == "Approved")
    return budget.total_allocation + total_income - total_expense

@router.get("/events/{event_id}/budget", response_model=BudgetResponse)
async def get_event_budget(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Gets the budget ledger details for an event. Restricted to managers, faculty, and auditors.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_authorized = (
        current_user.role in [UserRole.SUPER_ADMIN, UserRole.FACULTY]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Unauthorized budget access")
        
    budget = await Budget.find_one(Budget.event_id == event_id)
    if not budget:
        # Auto-initialize an empty budget if none exists
        budget = Budget(
            event_id=event_id,
            total_allocation=0.0,
            last_updated_by_user_id=current_user.id
        )
        await budget.insert()
        
    remaining = calculate_remaining_balance(budget)
    
    return BudgetResponse(
        id=budget.id,
        event_id=budget.event_id,
        total_allocation=budget.total_allocation,
        incomes=budget.incomes,
        expenses=budget.expenses,
        remaining_balance=remaining,
        last_updated_by_user_id=budget.last_updated_by_user_id,
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )

@router.post("/events/{event_id}/budget", response_model=BudgetResponse)
async def set_event_allocation(
    event_id: PydanticObjectId,
    payload: BudgetCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Initializes or updates total budget allocation. Requires faculty/president approval.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_authorized = (
        current_user.role in [UserRole.SUPER_ADMIN, UserRole.FACULTY]
        or (current_user.society_id == event.society_id and current_user.role == UserRole.SOCIETY_PRESIDENT)
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Unauthorized to allocate budget limits")
        
    budget = await Budget.find_one(Budget.event_id == event_id)
    if not budget:
        budget = Budget(
            event_id=event_id,
            total_allocation=payload.total_allocation,
            last_updated_by_user_id=current_user.id
        )
        await budget.insert()
    else:
        budget.total_allocation = payload.total_allocation
        budget.last_updated_by_user_id = current_user.id
        budget.updated_at = datetime.now(timezone.utc)
        await budget.save()
        
    await log_activity(
        actor_id=current_user.id,
        action="update_budget_allocation",
        target_model="events",
        target_id=event_id,
        changes_payload={"total_allocation": payload.total_allocation}
    )
    
    remaining = calculate_remaining_balance(budget)
    return BudgetResponse(
        id=budget.id,
        event_id=budget.event_id,
        total_allocation=budget.total_allocation,
        incomes=budget.incomes,
        expenses=budget.expenses,
        remaining_balance=remaining,
        last_updated_by_user_id=budget.last_updated_by_user_id,
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )

@router.post("/events/{event_id}/budget/transactions", response_model=BudgetResponse)
async def add_budget_transaction(
    event_id: PydanticObjectId,
    payload: BudgetTransactionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Adds a transaction (income or expense) to the ledger.
    If it is an expense, verifies it doesn't exceed remaining balance, otherwise sets status to 'Pending' (requires faculty signoff).
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_authorized = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    budget = await Budget.find_one(Budget.event_id == event_id)
    if not budget:
        budget = Budget(
            event_id=event_id,
            total_allocation=0.0,
            last_updated_by_user_id=current_user.id
        )
        await budget.insert()
        
    current_balance = calculate_remaining_balance(budget)
    
    # Generate unique transaction ID
    tr_id = str(uuid.uuid4())[:8].upper()
    
    transaction = {
        "id": tr_id,
        "amount": payload.amount,
        "receipt_url": payload.receipt_url,
        "description": payload.description,
        "created_at": datetime.now(timezone.utc),
        "created_by": str(current_user.id)
    }
    
    if payload.transaction_type.lower() == "income":
        transaction["source"] = payload.source_or_category
        # Incomes are pending by default until verified
        transaction["status"] = "Pending"
        budget.incomes.append(transaction)
    else:
        # Expense
        transaction["category"] = payload.source_or_category
        # If expense exceeds remaining balance, it must be Pending for Faculty override
        if payload.amount > current_balance:
            transaction["status"] = "Pending"
            transaction["notes"] = "Exceeds remaining allocation balance. Requires Faculty approval."
        else:
            transaction["status"] = "Approved"
        budget.expenses.append(transaction)
        
    budget.last_updated_by_user_id = current_user.id
    budget.updated_at = datetime.now(timezone.utc)
    await budget.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="add_budget_transaction",
        target_model="events",
        target_id=event_id,
        changes_payload={"type": payload.transaction_type, "amount": payload.amount, "status": transaction["status"]}
    )
    
    remaining = calculate_remaining_balance(budget)
    return BudgetResponse(
        id=budget.id,
        event_id=budget.event_id,
        total_allocation=budget.total_allocation,
        incomes=budget.incomes,
        expenses=budget.expenses,
        remaining_balance=remaining,
        last_updated_by_user_id=budget.last_updated_by_user_id,
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )

@router.put("/events/{event_id}/budget/transactions/{tr_id}/status", response_model=BudgetResponse)
async def update_transaction_status(
    event_id: PydanticObjectId,
    tr_id: str,
    status_val: str = Query(..., description="Approved, Rejected"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Approves or Rejects a pending transaction. Faculty Coordinator or President only.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_authorized = (
        current_user.role in [UserRole.SUPER_ADMIN, UserRole.FACULTY]
        or (current_user.society_id == event.society_id and current_user.role == UserRole.SOCIETY_PRESIDENT)
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Unauthorized transaction approval")
        
    budget = await Budget.find_one(Budget.event_id == event_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget ledger not found")
        
    # Search incomes
    found = False
    for item in budget.incomes:
        if item["id"] == tr_id:
            item["status"] = status_val.capitalize()
            item["approved_by"] = str(current_user.id)
            found = True
            break
            
    # Search expenses
    if not found:
        for item in budget.expenses:
            if item["id"] == tr_id:
                item["status"] = status_val.capitalize()
                item["approved_by"] = str(current_user.id)
                found = True
                break
                
    if not found:
        raise HTTPException(status_code=404, detail="Transaction ID not found in ledger")
        
    budget.last_updated_by_user_id = current_user.id
    budget.updated_at = datetime.now(timezone.utc)
    await budget.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="approve_budget_transaction",
        target_model="events",
        target_id=event_id,
        changes_payload={"transaction_id": tr_id, "status": status_val}
    )
    
    remaining = calculate_remaining_balance(budget)
    return BudgetResponse(
        id=budget.id,
        event_id=budget.event_id,
        total_allocation=budget.total_allocation,
        incomes=budget.incomes,
        expenses=budget.expenses,
        remaining_balance=remaining,
        last_updated_by_user_id=budget.last_updated_by_user_id,
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )
