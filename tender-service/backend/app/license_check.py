"""
License check dependency - verifies system license before allowing access.
If license server is not configured, access is allowed (dev mode).
"""
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models import SystemConfig
from app.licensing import verify_license


async def get_stored_license_key(db: AsyncSession) -> str | None:
    """Get license key from env or database."""
    if settings.LICENSE_KEY and settings.LICENSE_KEY.strip():
        return settings.LICENSE_KEY.strip()
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == "license_key")
    )
    config = result.scalar_one_or_none()
    return config.value if config and config.value else None


async def require_valid_license(db: AsyncSession = Depends(get_db)) -> bool:
    """
    Dependency that verifies the system has a valid license.
    - If LICENSE_SERVER_URL is not set: allow (dev mode)
    - If no license key configured: allow (admin can configure)
    - If license key invalid: reject
    """
    if not settings.LICENSE_SERVER_URL:
        return True

    license_key = await get_stored_license_key(db)
    if not license_key:
        return True  # No key yet - allow admin to login and configure

    result = await verify_license(license_key)
    if not result.valid:
        raise HTTPException(
            status_code=403,
            detail=f"License invalid: {result.message}"
        )

    return True
