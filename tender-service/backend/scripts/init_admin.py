"""Script to create Initial admin user. Run: python -m scripts.init_admin"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models import User
from app.auth import get_password_hash


async def main():
    await init_db()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.role == "admin"))
        if result.scalar_one_or_none():
            print("Admin user already exists")
            return
        admin = User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Администратор",
            company="Предприятие",
            role="admin"
        )
        db.add(admin)
        await db.flush()
        await db.commit()
        print("Admin created: admin@example.com / admin123")


if __name__ == "__main__":
    asyncio.run(main())
