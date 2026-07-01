"""Message schemas."""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.base import MessageStatusEnum
from app.schemas.common import ORMBase
from app.schemas.user import UserPublic


class MessageCreate(BaseModel):
    body: str | None = Field(default=None, max_length=4000)
    reply_to_id: int | None = None
    forwarded_from_id: int | None = None


class MessageUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class FileOut(ORMBase):
    id: int
    filename: str
    content_type: str
    size_bytes: int
    storage_path: str


class MessageOut(ORMBase):
    id: int
    chat_id: int
    sender_id: int
    body: str | None
    reply_to_id: int | None
    forwarded_from_id: int | None
    is_edited: bool
    is_deleted: bool
    created_at: datetime
    sender: UserPublic | None = None
    files: list[FileOut] = []


class MessageStatusUpdate(BaseModel):
    status: MessageStatusEnum
