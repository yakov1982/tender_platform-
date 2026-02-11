"""
License verification using License_key_server.
Calls the external license server to verify the system license.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import httpx

from app.config import settings


@dataclass
class LicenseResult:
    """Result of license verification."""
    valid: bool
    message: str
    product_name: Optional[str] = None
    expires_at: Optional[datetime] = None
    activations_remaining: Optional[int] = None


async def verify_license(license_key: str) -> LicenseResult:
    """
    Verify a license key against the license server.
    Returns LicenseResult with validation status.
    """
    if not settings.LICENSE_SERVER_URL:
        return LicenseResult(
            valid=True,
            message="License check disabled (no server configured)"
        )

    if not license_key or not license_key.strip():
        return LicenseResult(
            valid=False,
            message="License key is required"
        )

    url = f"{settings.LICENSE_SERVER_URL.rstrip('/')}/api/v1/verify"
    payload = {
        "license_key": license_key.strip(),
        "product_name": settings.LICENSE_PRODUCT_NAME,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            data = response.json()

        expires_at = None
        if data.get("expires_at"):
            try:
                expires_at = datetime.fromisoformat(
                    str(data["expires_at"]).replace("Z", "+00:00")
                )
            except (ValueError, TypeError):
                pass

        return LicenseResult(
            valid=data.get("valid", False),
            message=data.get("message", "Unknown error"),
            product_name=data.get("product_name"),
            expires_at=expires_at,
            activations_remaining=data.get("activations_remaining"),
        )
    except httpx.TimeoutException:
        return LicenseResult(
            valid=False,
            message="License server is not responding"
        )
    except httpx.RequestError as e:
        return LicenseResult(
            valid=False,
            message=f"Could not connect to license server: {e}"
        )
    except Exception as e:
        return LicenseResult(
            valid=False,
            message=f"License verification failed: {e}"
        )
