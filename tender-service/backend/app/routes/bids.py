from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Tender, Bid
from app.schemas import BidCreate, BidResponse, BidWithBidder, UserResponse
from app.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/bids", tags=["bids"])


@router.post("", response_model=BidResponse)
async def create_bid(
    bid_data: BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Tender).where(Tender.id == bid_data.tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    if tender.status != "bidding":
        raise HTTPException(status_code=400, detail="Tender is not accepting bids")
    existing = await db.execute(
        select(Bid).where(Bid.tender_id == bid_data.tender_id, Bid.bidder_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already submitted a bid")
    if bid_data.amount > tender.budget:
        raise HTTPException(status_code=400, detail="Bid amount exceeds tender budget")
    bid = Bid(
        tender_id=bid_data.tender_id,
        bidder_id=current_user.id,
        amount=bid_data.amount,
        proposal=bid_data.proposal
    )
    db.add(bid)
    await db.flush()
    await db.refresh(bid)
    return bid


@router.get("/tender/{tender_id}", response_model=list[BidWithBidder])
async def get_tender_bids(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    bids_result = await db.execute(
        select(Bid).where(Bid.tender_id == tender_id).order_by(Bid.amount)
    )
    bids = bids_result.scalars().all()
    response = []
    for bid in bids:
        await db.refresh(bid, ["bidder"])
        response.append(BidWithBidder(
            id=bid.id,
            tender_id=bid.tender_id,
            bidder_id=bid.bidder_id,
            amount=bid.amount,
            proposal=bid.proposal,
            status=bid.status,
            created_at=bid.created_at,
            bidder=UserResponse.model_validate(bid.bidder)
        ))
    return response


@router.get("/my", response_model=list[BidResponse])
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Bid).where(Bid.bidder_id == current_user.id).order_by(Bid.created_at.desc())
    )
    bids = result.scalars().all()
    return bids


class BidStatusUpdate(BaseModel):
    status: str


@router.patch("/{bid_id}/status")
async def update_bid_status(
    bid_id: int,
    data: BidStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    status = data.status
    if status not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    bid.status = status
    if status == "accepted":
        tender_result = await db.execute(select(Tender).where(Tender.id == bid.tender_id))
        tender = tender_result.scalar_one_or_none()
        if tender:
            tender.status = "awarded"
    await db.flush()
    return {"message": "Bid status updated", "status": status}
