from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.schemas.chat import ChatMessageSend, ChatMessageResponse
from app.core.dependencies import get_current_active_user

router = APIRouter()

@router.get("/{channel_name}", response_model=List[ChatMessageResponse])
async def get_channel_chat_history(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves message history for a specific chat channel.
    """
    # Simply load the last 50 messages from the database
    messages = await ChatMessage.find(
        ChatMessage.channel_name == channel_name
    ).sort("created_at").limit(50).to_list()
    
    return messages

@router.post("/{channel_name}", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_channel_message(
    channel_name: str,
    payload: ChatMessageSend,
    current_user: User = Depends(get_current_active_user)
):
    """
    Sends a chat message to a specific channel.
    """
    role_label = current_user.role.value.replace("_", " ").upper()
    
    message = ChatMessage(
        channel_name=channel_name,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=role_label,
        message_text=payload.message_text
    )
    await message.insert()
    return message
