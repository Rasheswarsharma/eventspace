from typing import List
from fastapi import APIRouter, Depends, status
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.core.dependencies import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
async def get_user_notifications(
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the notification feed for the current authenticated user.
    """
    return await Notification.find(
        Notification.recipient_user_id == current_user.id
    ).sort("-created_at").to_list()

@router.put("/read", status_code=status.HTTP_200_OK)
async def mark_notifications_read(
    current_user: User = Depends(get_current_active_user)
):
    """
    Marks all notifications for the user as read.
    """
    notifications = await Notification.find(
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).to_list()
    
    for notif in notifications:
        notif.is_read = True
        await notif.save()
        
    return {"message": "All notifications marked as read"}

@router.delete("/", status_code=status.HTTP_200_OK)
async def clear_notifications(
    current_user: User = Depends(get_current_active_user)
):
    """
    Clears all notifications for the current user.
    """
    await Notification.find(
        Notification.recipient_user_id == current_user.id
    ).delete()
    
    return {"message": "Notifications cleared"}
