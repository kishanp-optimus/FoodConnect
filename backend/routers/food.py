from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import os
import uuid
import shutil

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import get_db
from models.models import User, FoodItem, FoodType as ModelFoodType
from schemas.schemas import (
    FoodItemCreate, 
    FoodItemUpdate, 
    FoodItemResponse, 
    FoodType
)
from services.auth import get_current_user

router = APIRouter(prefix="/food", tags=["Food Items"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=FoodItemResponse)
async def create_food_item(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    food_type: FoodType = Form(...),
    quantity: int = Form(...),
    price: float = Form(...),
    expiry_date: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only doners can create food items
    if current_user.role.value != "doner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doners can create food listings"
        )
    
    # Parse expiry date
    try:
        expiry_datetime = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
    except ValueError:
        try:
            expiry_datetime = datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use ISO format or YYYY-MM-DD"
            )
    
    # Handle image upload
    image_path = None
    if image:
        file_extension = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_path = unique_filename
    
    # Create food item
    food_item = FoodItem(
        title=title,
        description=description,
        food_type=ModelFoodType(food_type.value),
        quantity=quantity,
        price=price,
        expiry_date=expiry_datetime,
        image_path=image_path,
        created_by=current_user.id
    )
    
    db.add(food_item)
    db.commit()
    db.refresh(food_item)
    
    return FoodItemResponse.model_validate(food_item)

@router.get("/", response_model=List[FoodItemResponse])
async def get_food_items(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * limit
    
    # Get non-expired, available items
    food_items = db.query(FoodItem).filter(
        FoodItem.expiry_date > datetime.utcnow(),
        FoodItem.is_available == 1
    ).order_by(FoodItem.created_at.desc()).offset(offset).limit(limit).all()
    
    return [FoodItemResponse.model_validate(item) for item in food_items]

@router.get("/my-listings", response_model=List[FoodItemResponse])
async def get_my_listings(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * limit
    
    food_items = db.query(FoodItem).filter(
        FoodItem.created_by == current_user.id
    ).order_by(FoodItem.created_at.desc()).offset(offset).limit(limit).all()
    
    return [FoodItemResponse.model_validate(item) for item in food_items]

@router.get("/search", response_model=List[FoodItemResponse])
async def search_food_items(
    keyword: Optional[str] = None,
    food_type: Optional[FoodType] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * limit
    
    query = db.query(FoodItem).filter(
        FoodItem.expiry_date > datetime.utcnow(),
        FoodItem.is_available == 1
    )
    
    if keyword:
        query = query.filter(
            or_(
                FoodItem.title.ilike(f"%{keyword}%"),
                FoodItem.description.ilike(f"%{keyword}%")
            )
        )
    
    if food_type:
        query = query.filter(FoodItem.food_type == ModelFoodType(food_type.value))
    
    if min_price is not None:
        query = query.filter(FoodItem.price >= min_price)
    
    if max_price is not None:
        query = query.filter(FoodItem.price <= max_price)
    
    food_items = query.order_by(FoodItem.created_at.desc()).offset(offset).limit(limit).all()
    
    return [FoodItemResponse.model_validate(item) for item in food_items]

@router.get("/{item_id}", response_model=FoodItemResponse)
async def get_food_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food_item = db.query(FoodItem).filter(FoodItem.id == item_id).first()
    
    if not food_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )
    
    # Load creator relationship
    response = FoodItemResponse.model_validate(food_item)
    response.creator = food_item.creator
    
    return response

@router.put("/{item_id}", response_model=FoodItemResponse)
async def update_food_item(
    item_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    food_type: Optional[FoodType] = Form(None),
    quantity: Optional[int] = Form(None),
    price: Optional[float] = Form(None),
    expiry_date: Optional[str] = Form(None),
    is_available: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food_item = db.query(FoodItem).filter(FoodItem.id == item_id).first()
    
    if not food_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )
    
    if food_item.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own listings"
        )
    
    # Update fields
    if title is not None:
        food_item.title = title
    if description is not None:
        food_item.description = description
    if food_type is not None:
        food_item.food_type = ModelFoodType(food_type.value)
    if quantity is not None:
        food_item.quantity = quantity
    if price is not None:
        food_item.price = price
    if is_available is not None:
        food_item.is_available = is_available
    
    if expiry_date is not None:
        try:
            food_item.expiry_date = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        except ValueError:
            try:
                food_item.expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format"
                )
    
    # Handle image upload
    if image:
        # Delete old image if exists
        if food_item.image_path:
            old_file_path = os.path.join(UPLOAD_DIR, food_item.image_path)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        file_extension = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        food_item.image_path = unique_filename
    
    db.commit()
    db.refresh(food_item)
    
    return FoodItemResponse.model_validate(food_item)

@router.delete("/{item_id}")
async def delete_food_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food_item = db.query(FoodItem).filter(FoodItem.id == item_id).first()
    
    if not food_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found"
        )
    
    if food_item.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own listings"
        )
    
    # Check if there are any orders for this food item
    from models.models import Order
    order_count = db.query(Order).filter(Order.food_item_id == item_id).count()
    if order_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete this listing. It has {order_count} order(s). You can mark it as unavailable instead."
        )
    
    # Delete image if exists
    if food_item.image_path:
        file_path = os.path.join(UPLOAD_DIR, food_item.image_path)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.delete(food_item)
    db.commit()
    
    return {"message": "Food item deleted successfully"}

@router.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    file_extension = os.path.splitext(image.filename)[1]
    if file_extension.lower() not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed: jpg, jpeg, png, gif, webp"
        )
    
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    return {"filename": unique_filename}
