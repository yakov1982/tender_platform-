"""License management API - integrates with License_key_server."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, SystemConfig
from app.auth import get_current_admin
from app.licensing import verify_license

router = APIRouter(prefix="/license", tags=["license"])


class LicenseKeyRequest(BaseModel):
    license_key: str


class LicenseStatusResponse(BaseModel):
    configured: bool
    valid: bool
    message: str
    product_name: str | None = None
    expires_at: str | None = None


async def get_license_key(db: AsyncSession) -> str | None:
    """Get license key from env or database."""
    from app.config import settings
    if settings.LICENSE_KEY and settings.LICENSE_KEY.strip():
        return settings.LICENSE_KEY.strip()
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == "license_key")
    )
    config = result.scalar_one_or_none()
    return config.value if config and config.value else None


@router.get("/status", response_model=LicenseStatusResponse)
async def get_license_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get current license status.
    Admin only.
    """
    license_key = await get_license_key(db)
    if not license_key:
        return LicenseStatusResponse(
            configured=False,
            valid=False,
            message="License key not configured"
        )

    result = await verify_license(license_key)
    return LicenseStatusResponse(
        configured=True,
        valid=result.valid,
        message=result.message,
        product_name=result.product_name,
        expires_at=result.expires_at.isoformat() if result.expires_at else None,
    )


@router.post("/configure", response_model=LicenseStatusResponse)
async def configure_license(
    data: LicenseKeyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Save and verify license key.
    Admin only.
    """
    license_key = data.license_key.strip()
    if not license_key:
        raise HTTPException(status_code=400, detail="License key is required")

    # Verify first
    result = await verify_license(license_key)
    if not result.valid:
        return LicenseStatusResponse(
            configured=False,
            valid=False,
            message=result.message,
        )

    # Save to database
    existing = await db.execute(
        select(SystemConfig).where(SystemConfig.key == "license_key")
    )
    config = existing.scalar_one_or_none()
    if config:
        config.value = license_key
    else:
        config = SystemConfig(key="license_key", value=license_key)
        db.add(config)
    await db.flush()

    return LicenseStatusResponse(
        configured=True,
        valid=True,
        message=result.message,
        product_name=result.product_name,
        expires_at=result.expires_at.isoformat() if result.expires_at else None,
    )
