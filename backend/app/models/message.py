"""Messages and per-recipient delivery/read status.

Reply and forward are modeled as self-referential foreign keys. Per-recipient
status rows (``MessageStatus``) are what enable accurate read/delivery receipts
in both direct and group chats.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import MessageStatusEnum, TimestampMixin

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.file import File
    from app.models.user import User


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    body: Mapped[str | None] = mapped_column(Text, nullable=True)

    reply_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("messages.id", ondelete="SET NULL"), nullable=True
    )
    forwarded_from_id: Mapped[int | None] = mapped_column(
        ForeignKey("messages.id", ondelete="SET NULL"), nullable=True
    )

    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    chat: Mapped[Chat] = relationship(back_populates="messages")
    sender: Mapped[User] = relationship()
    statuses: Mapped[list[MessageStatus]] = relationship(
        back_populates="message", cascade="all, delete-orphan"
    )
    files: Mapped[list[File]] = relationship(
        back_populates="message", cascade="all, delete-orphan"
    )
    reply_to: Mapped[Message | None] = relationship(
        remote_side="Message.id", foreign_keys=[reply_to_id]
    )


class MessageStatus(Base, TimestampMixin):
    __tablename__ = "message_status"
    __table_args__ = (UniqueConstraint("message_id", "user_id", name="uq_message_user_status"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    message_id: Mapped[int] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[MessageStatusEnum] = mapped_column(
        Enum(MessageStatusEnum, name="message_status_enum"),
        default=MessageStatusEnum.SENT,
        nullable=False,
    )

    message: Mapped[Message] = relationship(back_populates="statuses")
