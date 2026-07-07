from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.budget import Budget
from app.models.enums import UserRole, EventStatus
from app.core.dependencies import require_roles
from app.utils.audit import log_activity

router = APIRouter()

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_faculty_dashboard_stats(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.FACULTY]))
):
    """
    Returns general stats for the Faculty Advisor dashboard:
    - Number of pending events
    - Number of pending budget transactions
    - Total societies count
    """
    pending_events_count = await Event.find(
        Event.status == EventStatus.DRAFT,
        Event.is_archived == False
    ).count()
    
    # Budgets with pending transactions
    all_budgets = await Budget.all().to_list()
    pending_transactions_count = 0
    for b in all_budgets:
        pending_transactions_count += sum(1 for item in b.incomes if item["status"] == "Pending")
        pending_transactions_count += sum(1 for item in b.expenses if item["status"] == "Pending")
        
    societies_count = await User.find(User.role == UserRole.SOCIETY_PRESIDENT).count()
    
    return {
        "pending_events": pending_events_count,
        "pending_budgets": pending_transactions_count,
        "total_societies": societies_count
    }

@router.get("/events/pending", response_model=List[Any])
async def list_pending_events(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.FACULTY]))
):
    """
    Lists all events awaiting faculty approval (Draft events).
    """
    return await Event.find(Event.status == EventStatus.DRAFT, Event.is_archived == False).to_list()

@router.put("/events/{id}/approve", status_code=status.HTTP_200_OK)
async def approve_event_proposal(
    id: PydanticObjectId,
    remarks: str = Query(default="Approved"),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.FACULTY]))
):
    """
    Approves an event proposal. Sets status to PUBLISHED.
    """
    event = await Event.find_one(Event.id == id, Event.is_archived == False)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.status = EventStatus.PUBLISHED
    event.updated_at = datetime.now(timezone.utc)
    await event.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="faculty_approve_event",
        target_model="events",
        target_id=id,
        changes_payload={"remarks": remarks}
    )
    return {"message": "Event proposal successfully approved", "event_id": str(id)}

@router.put("/events/{id}/reject", status_code=status.HTTP_200_OK)
async def reject_event_proposal(
    id: PydanticObjectId,
    remarks: str = Query(...),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.FACULTY]))
):
    """
    Rejects an event proposal with remarks. Soft archives it.
    """
    event = await Event.find_one(Event.id == id, Event.is_archived == False)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.is_archived = True
    await event.save()
    
    await log_activity(
        actor_id=current_user.id,
        action="faculty_reject_event",
        target_model="events",
        target_id=id,
        changes_payload={"remarks": remarks}
    )
    return {"message": "Event proposal rejected and archived", "event_id": str(id)}

@router.get("/budgets/pending")
async def list_pending_budget_transactions(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.FACULTY]))
):
    """
    Lists all pending budget incomes/expenses transactions from all events.
    """
    budgets = await Budget.all().to_list()
    pending_list = []
    
    for b in budgets:
        event = await Event.get(b.event_id)
        event_name = event.name if event else "Unknown Event"
        
        # Collect pending incomes
        for inc in b.incomes:
            if inc["status"] == "Pending":
                pending_list.append({
                    "event_id": str(b.event_id),
                    "event_name": event_name,
                    "transaction_id": inc["id"],
                    "type": "income",
                    "source_or_category": inc.get("source"),
                    "amount": inc["amount"],
                    "receipt_url": inc.get("receipt_url"),
                    "created_at": inc["created_at"]
                })
                
        # Collect pending expenses
        for exp in b.expenses:
            if exp["status"] == "Pending":
                pending_list.append({
                    "event_id": str(b.event_id),
                    "event_name": event_name,
                    "transaction_id": exp["id"],
                    "type": "expense",
                    "source_or_category": exp.get("category"),
                    "amount": exp["amount"],
                    "receipt_url": exp.get("receipt_url"),
                    "created_at": exp["created_at"]
                })
                
    return pending_list
