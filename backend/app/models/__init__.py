"""Aggregate import of all ORM models.

Importing this package ensures every model is registered on ``Base.metadata``
before Alembic autogenerate or ``create_all`` runs.
"""
from app.core.database import Base
from app.models.chat import Chat, ChatMember
from app.models.file import File
from app.models.message import Message, MessageStatus
from app.models.notification import Notification
from app.models.profile import Profile
from app.models.refresh_token import RefreshToken
from app.models.user import User

__all__ = [
    "Base",
    "User",
    "Profile",
    "Chat",
    "ChatMember",
    "Message",
    "MessageStatus",
    "File",
    "Notification",
    "RefreshToken",
]
