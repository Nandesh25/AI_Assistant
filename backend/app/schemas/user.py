"""User and profile schemas."""
from pydantic import BaseModel, EmailStr, Field

from app.models.base import UserRole
from app.schemas.common import ORMBase


class ProfileOut(ORMBase):
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


class UserOut(ORMBase):
    id: int
    email: EmailStr
    username: str
    role: UserRole
    is_active: bool
    profile: ProfileOut | None = None


class UserPublic(ORMBase):
    """Trimmed view safe to expose to other users (e.g. in search)."""

    id: int
    username: str
    profile: ProfileOut | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=1000)


class AvatarUpdate(BaseModel):
    avatar_url: str = Field(max_length=512)
