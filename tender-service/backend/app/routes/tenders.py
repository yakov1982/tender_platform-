from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models import User, Tender, Bid
from app.schemas import TenderCreate, TenderUpdate, TenderResponse
from app.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/tenders", tags=["tenders"])


@router.get("", response_model=list[TenderResponse])
async def list_tenders(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    include_drafts: bool = False,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Tender)
    if not (include_drafts and current_user.role == "admin"):
        query = query.where(Tender.status != "draft")
    if status_filter:
        query = query.where(Tender.status == status_filter)
    if category:
        query = query.where(Tender.category == category)
    query = query.order_by(desc(Tender.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    tenders = result.scalars().all()
    response = []
    for t in tenders:
        count_result = await db.execute(
            select(func.count()).select_from(Bid).where(Bid.tender_id == t.id)
        )
        bids_count = count_result.scalar() or 0
        response.append(TenderResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            category=t.category,
            budget=t.budget,
            status=t.status,
            deadline=t.deadline,
            created_by=t.created_by,
            created_at=t.created_at,
            bids_count=bids_count
        ))
    return response


@router.get("/{tender_id}", response_model=TenderResponse)
async def get_tender(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    if tender.status == "draft" and tender.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    count_result = await db.execute(
        select(func.count()).select_from(Bid).where(Bid.tender_id == tender.id)
    )
    bids_count = count_result.scalar() or 0
    return TenderResponse(
        id=tender.id,
        title=tender.title,
        description=tender.description,
        category=tender.category,
        budget=tender.budget,
        status=tender.status,
        deadline=tender.deadline,
        created_by=tender.created_by,
        created_at=tender.created_at,
        bids_count=bids_count
    )


@router.post("", response_model=TenderResponse)
async def create_tender(
    tender_data: TenderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    tender = Tender(
        **tender_data.model_dump(),
        created_by=current_user.id,
        status="draft"
    )
    db.add(tender)
    await db.flush()
    await db.refresh(tender)
    return TenderResponse(
        id=tender.id,
        title=tender.title,
        description=tender.description,
        category=tender.category,
        budget=tender.budget,
        status=tender.status,
        deadline=tender.deadline,
        created_by=tender.created_by,
        created_at=tender.created_at,
        bids_count=0
    )


@router.patch("/{tender_id}", response_model=TenderResponse)
async def update_tender(
    tender_id: int,
    tender_data: TenderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    update_data = tender_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tender, key, value)
    await db.flush()
    await db.refresh(tender)
    count_result = await db.execute(
        select(func.count()).select_from(Bid).where(Bid.tender_id == tender.id)
    )
    bids_count = count_result.scalar() or 0
    return TenderResponse(
        id=tender.id,
        title=tender.title,
        description=tender.description,
        category=tender.category,
        budget=tender.budget,
        status=tender.status,
        deadline=tender.deadline,
        created_by=tender.created_by,
        created_at=tender.created_at,
        bids_count=bids_count
    )


@router.post("/{tender_id}/publish")
async def publish_tender(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    tender.status = "bidding"
    await db.flush()
    return {"message": "Tender published", "status": "bidding"}


@router.delete("/{tender_id}")
async def delete_tender(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    await db.delete(tender)
    await db.flush()
    return {"message": "Tender deleted"}
