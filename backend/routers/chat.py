from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import get_db
from models.models import User, Order, Message, Notification
from schemas.schemas import MessageCreate, MessageResponse
from services.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the order to determine the receiver
    order = db.query(Order).filter(Order.id == message_data.order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user is part of this order
    if order.doner_id != current_user.id and order.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this order chat"
        )
    
    # Determine receiver
    receiver_id = order.receiver_id if current_user.id == order.doner_id else order.doner_id
    
    # Create message
    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        order_id=message_data.order_id,
        message=message_data.message
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Create notification for receiver
    notification = Notification(
        user_id=receiver_id,
        title="New Message",
        message=f"{current_user.full_name}: {message_data.message[:50]}...",
        type="message",
        reference_id=order.id
    )
    
    db.add(notification)
    db.commit()
    
    response = MessageResponse.model_validate(message)
    response.sender = current_user
    
    return response

@router.get("/order/{order_id}", response_model=List[MessageResponse])
async def get_order_messages(
    order_id: str,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the order
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user is part of this order
    if order.doner_id != current_user.id and order.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this order chat"
        )
    
    offset = (page - 1) * limit
    
    messages = db.query(Message).filter(
        Message.order_id == order_id
    ).order_by(Message.timestamp.asc()).offset(offset).limit(limit).all()
    
    # Mark messages as read
    db.query(Message).filter(
        Message.order_id == order_id,
        Message.receiver_id == current_user.id,
        Message.is_read == 0
    ).update({"is_read": 1})
    db.commit()
    
    results = []
    for msg in messages:
        response = MessageResponse.model_validate(msg)
        response.sender = msg.sender
        results.append(response)
    
    return results

@router.get("/conversations")
async def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all orders where user is involved
    orders = db.query(Order).filter(
        or_(
            Order.doner_id == current_user.id,
            Order.receiver_id == current_user.id
        )
    ).all()
    
    conversations = []
    for order in orders:
        # Get last message
        last_message = db.query(Message).filter(
            Message.order_id == order.id
        ).order_by(Message.timestamp.desc()).first()
        
        # Get unread count
        unread_count = db.query(Message).filter(
            Message.order_id == order.id,
            Message.receiver_id == current_user.id,
            Message.is_read == 0
        ).count()
        
        # Determine the other user
        other_user = order.receiver if order.doner_id == current_user.id else order.doner
        
        conversations.append({
            "order_id": order.id,
            "food_item": {
                "id": order.food_item.id,
                "title": order.food_item.title,
                "image_path": order.food_item.image_path
            },
            "other_user": {
                "id": other_user.id,
                "username": other_user.username,
                "full_name": other_user.full_name
            },
            "last_message": {
                "message": last_message.message if last_message else None,
                "timestamp": last_message.timestamp.isoformat() if last_message else None,
                "sender_id": last_message.sender_id if last_message else None
            } if last_message else None,
            "unread_count": unread_count,
            "order_status": order.status.value
        })
    
    # Sort by last message timestamp
    conversations.sort(
        key=lambda x: x["last_message"]["timestamp"] if x["last_message"] else "",
        reverse=True
    )
    
    return conversations

@router.put("/read/{order_id}")
async def mark_messages_read(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Update all unread messages for this order
    db.query(Message).filter(
        Message.order_id == order_id,
        Message.receiver_id == current_user.id,
        Message.is_read == 0
    ).update({"is_read": 1})
    db.commit()
    
    return {"message": "Messages marked as read"}
