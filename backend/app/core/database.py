"""Database engine, session factory, and the declarative base.

The ``get_db`` dependency yields a session per request and guarantees cleanup,
which is the FastAPI-idiomatic way to scope a unit of work to a request.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # validate connections before use (survives DB restarts)
    echo=settings.DEBUG and settings.ENVIRONMENT == "development",
)

SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """Yield a transactional database session and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
