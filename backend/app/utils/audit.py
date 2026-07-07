from typing import Optional, Dict, Any
from beanie import PydanticObjectId
from app.models.audit_log import AuditLog

async def log_activity(
    actor_id: Optional[PydanticObjectId],
    action: str,
    target_model: str,
    target_id: Optional[PydanticObjectId] = None,
    changes_payload: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Logs administrative operations to the AuditLogs collection.
    """
    log_entry = AuditLog(
        actor_user_id=actor_id,
        action=action,
        target_model=target_model,
        target_id=target_id,
        changes_payload=changes_payload or {},
        ip_address=ip_address,
        user_agent=user_agent
    )
    await log_entry.insert()
