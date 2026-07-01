"""Chat (conversation) and its membership.

A single ``Chat`` models both one-to-one (``DIRECT``) and ``GROUP`` conversations.
Group-specific fields (name, avatar, description) live here and are null for
direct chats. Membership — including per-member admin rights — is captured by
``ChatMember``.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import ChatType, MemberRole, TimestampMixin

if TYPE_CHECKING:
    from app.models.message import Message
    from app.models.user import User


class Chat(Base, TimestampMixin):
    __tablename__ = "chats"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[ChatType] = mapped_column(Enum(ChatType, name="chat_type"), nullable=False)
    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Group-only fields (NULL for direct chats)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    members: Mapped[list[ChatMember]] = relationship(
        back_populates="chat", cascade="all, delete-orphan"
    )
    messages: Mapped[list[Message]] = relationship(
        back_populates="chat", cascade="all, delete-orphan"
    )


class ChatMember(Base, TimestampMixin):
    __tablename__ = "chat_members"
    __table_args__ = (UniqueConstraint("chat_id", "user_id", name="uq_chat_member"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole, name="member_role"), default=MemberRole.MEMBER, nullable=False
    )

    chat: Mapped[Chat] = relationship(back_populates="members")
    user: Mapped[User] = relationship()
