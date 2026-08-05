import os
import tempfile
from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

database_url = settings.database_url
if database_url.startswith("sqlite+aiosqlite:///"):
    db_path = database_url.replace("sqlite+aiosqlite:///", "", 1)
    if not db_path.startswith("/"):
        target = Path(settings.base_path) / db_path
    else:
        target = Path(db_path)
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        fallback = Path(tempfile.gettempdir()) / target.name
        database_url = f"sqlite+aiosqlite:///{fallback}"

engine = create_async_engine(database_url, echo=settings.app_env == "development")
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
