"""Chat and group schemas."""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.base import ChatType, MemberRole
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class ChatMemberOut(ORMBase):
    id: int
    user_id: int
    role: MemberRole
    user: UserPublic | None = None


class ChatOut(ORMBase):
    id: int
    type: ChatType
    name: str | None
    description: str | None
    avatar_url: str | None
    created_by: int | None
    created_at: datetime
    members: list[ChatMemberOut] = []


class DirectChatCreate(BaseModel):
    """Start (or fetch existing) a one-to-one chat with another user."""

    target_user_id: int


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    member_ids: list[int] = Field(default_factory=list)


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    avatar_url: str | None = Field(default=None, max_length=512)


class MemberAdd(BaseModel):
    user_id: int


class MemberRoleUpdate(BaseModel):
    role: MemberRole
