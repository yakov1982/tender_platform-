from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    company: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Tender schemas
class TenderBase(BaseModel):
    title: str
    description: str
    category: str
    budget: float
    deadline: datetime


class TenderCreate(TenderBase):
    pass


class TenderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None


class TenderResponse(TenderBase):
    id: int
    status: str
    created_by: int
    created_at: datetime
    bids_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Bid schemas
class BidBase(BaseModel):
    amount: float
    proposal: str


class BidCreate(BidBase):
    tender_id: int


class BidUpdate(BaseModel):
    amount: Optional[float] = None
    proposal: Optional[str] = None
    status: Optional[str] = None


class BidResponse(BidBase):
    id: int
    tender_id: int
    bidder_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BidWithBidder(BidResponse):
    bidder: UserResponse

    class Config:
        from_attributes = True
