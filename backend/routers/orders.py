from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import get_db
from models.models import User, FoodItem, Order, Notification, OrderStatus as ModelOrderStatus
from schemas.schemas import OrderCreate, OrderUpdate, OrderResponse, OrderStatus
from services.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only receivers can create orders
    if current_user.role.value != "receiver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only receivers can place orders"
        )
    
    # Get food item
    food_item = db.query(FoodItem).filter(FoodItem.id == order_data.food_item_id).first()
    
    if not food_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )
    
    if food_item.expiry_date < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This food item has expired"
        )
    
    if not food_item.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This food item is not available"
        )
    
    if order_data.quantity > food_item.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {food_item.quantity} items available"
        )
    
    # Calculate total price
    total_price = food_item.price * order_data.quantity
    
    # Create order
    order = Order(
        food_item_id=food_item.id,
        doner_id=food_item.created_by,
        receiver_id=current_user.id,
        quantity=order_data.quantity,
        total_price=total_price,
        status=ModelOrderStatus.PENDING
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Create notification for doner
    notification = Notification(
        user_id=food_item.created_by,
        title="New Order Received",
        message=f"{current_user.full_name} has ordered {order_data.quantity}x {food_item.title}",
        type="order",
        reference_id=order.id
    )
    
    db.add(notification)
    db.commit()
    
    # Build response with relationships
    response = OrderResponse.model_validate(order)
    response.food_item = food_item
    response.receiver = current_user
    response.doner = food_item.creator
    
    return response

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    status_filter: OrderStatus = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * limit
    
    # Filter orders based on user role
    if current_user.role.value == "doner":
        query = db.query(Order).filter(Order.doner_id == current_user.id)
    else:
        query = db.query(Order).filter(Order.receiver_id == current_user.id)
    
    if status_filter:
        query = query.filter(Order.status == ModelOrderStatus(status_filter.value))
    
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    
    results = []
    for order in orders:
        response = OrderResponse.model_validate(order)
        response.food_item = order.food_item
        response.receiver = order.receiver
        response.doner = order.doner
        results.append(response)
    
    return results

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
            detail="You don't have access to this order"
        )
    
    response = OrderResponse.model_validate(order)
    response.food_item = order.food_item
    response.receiver = order.receiver
    response.doner = order.doner
    
    return response

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Only doner can update order status
    if order.doner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the doner can update order status"
        )
    
    # Update status
    order.status = ModelOrderStatus(order_update.status.value)
    order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    # Create notification for receiver
    status_text = "accepted" if order_update.status == OrderStatus.ACCEPTED else "rejected"
    notification = Notification(
        user_id=order.receiver_id,
        title=f"Order {status_text.capitalize()}",
        message=f"Your order for {order.food_item.title} has been {status_text}",
        type="order",
        reference_id=order.id
    )
    
    db.add(notification)
    
    # If accepted, update food item quantity
    if order_update.status == OrderStatus.ACCEPTED:
        food_item = order.food_item
        
        # Check if enough quantity is available
        if food_item.quantity < order.quantity:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient quantity. Only {food_item.quantity} items available."
            )
        
        food_item.quantity -= order.quantity
        if food_item.quantity <= 0:
            food_item.is_available = 0
    
    db.commit()
    
    response = OrderResponse.model_validate(order)
    response.food_item = order.food_item
    response.receiver = order.receiver
    response.doner = order.doner
    
    return response

@router.get("/stats/summary")
async def get_order_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.value == "doner":
        total_orders = db.query(Order).filter(Order.doner_id == current_user.id).count()
        pending_orders = db.query(Order).filter(
            Order.doner_id == current_user.id,
            Order.status == ModelOrderStatus.PENDING
        ).count()
        accepted_orders = db.query(Order).filter(
            Order.doner_id == current_user.id,
            Order.status == ModelOrderStatus.ACCEPTED
        ).count()
        total_listings = db.query(FoodItem).filter(
            FoodItem.created_by == current_user.id
        ).count()
        active_listings = db.query(FoodItem).filter(
            FoodItem.created_by == current_user.id,
            FoodItem.is_available == 1,
            FoodItem.expiry_date > datetime.utcnow()
        ).count()
    else:
        total_orders = db.query(Order).filter(Order.receiver_id == current_user.id).count()
        pending_orders = db.query(Order).filter(
            Order.receiver_id == current_user.id,
            Order.status == ModelOrderStatus.PENDING
        ).count()
        accepted_orders = db.query(Order).filter(
            Order.receiver_id == current_user.id,
            Order.status == ModelOrderStatus.ACCEPTED
        ).count()
        total_listings = 0
        active_listings = 0
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "accepted_orders": accepted_orders,
        "total_listings": total_listings,
        "active_listings": active_listings
    }
