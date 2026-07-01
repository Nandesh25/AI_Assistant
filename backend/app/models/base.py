"""Shared model mixins and enums."""
import enum
from datetime import UTC, datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


class TimestampMixin:
    """Adds created_at / updated_at columns managed by the database."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class ChatType(str, enum.Enum):
    DIRECT = "direct"
    GROUP = "group"


class MemberRole(str, enum.Enum):
    MEMBER = "member"
    ADMIN = "admin"


class MessageStatusEnum(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
