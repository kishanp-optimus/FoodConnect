from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    DONER = "doner"
    RECEIVER = "receiver"

class FoodType(str, Enum):
    PACKAGED = "packaged"
    NON_PACKAGED = "non-packaged"

class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserPublic(BaseModel):
    id: str
    username: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Food Item Schemas
class FoodItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    food_type: FoodType
    quantity: int = Field(..., ge=0)
    price: float = Field(..., ge=0)
    expiry_date: datetime

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    food_type: Optional[FoodType] = None
    quantity: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    expiry_date: Optional[datetime] = None
    is_available: Optional[int] = None

class FoodItemResponse(FoodItemBase):
    id: str
    image_path: Optional[str] = None
    created_by: str
    created_at: datetime
    is_available: int
    creator: Optional[UserPublic] = None
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    food_item_id: str
    quantity: int = Field(..., ge=1)

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    status: OrderStatus

class OrderResponse(BaseModel):
    id: str
    food_item_id: str
    doner_id: str
    receiver_id: str
    quantity: int
    total_price: float
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    food_item: Optional[FoodItemResponse] = None
    receiver: Optional[UserPublic] = None
    doner: Optional[UserPublic] = None
    
    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    message: str = Field(..., min_length=1)

class MessageCreate(MessageBase):
    order_id: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    order_id: str
    message: str
    timestamp: datetime
    is_read: int
    sender: Optional[UserPublic] = None
    
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    reference_id: Optional[str] = None
    is_read: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Search Schemas
class SearchParams(BaseModel):
    keyword: Optional[str] = None
    food_type: Optional[FoodType] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    page: int = 1
    limit: int = 10

# Pagination Response
class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    limit: int
    total_pages: int
