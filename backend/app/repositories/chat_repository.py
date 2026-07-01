"""Chat and membership data access (covers direct + group conversations)."""
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload

from app.models.base import ChatType
from app.models.chat import Chat, ChatMember
from app.repositories.base import BaseRepository


class ChatRepository(BaseRepository[Chat]):
    model = Chat

    def get_with_members(self, chat_id: int) -> Chat | None:
        stmt = (
            select(Chat)
            .options(selectinload(Chat.members).selectinload(ChatMember.user))
            .where(Chat.id == chat_id)
        )
        return self.db.scalars(stmt).first()

    def list_for_user(self, user_id: int, *, limit: int = 50, offset: int = 0) -> list[Chat]:
        stmt = (
            select(Chat)
            .join(ChatMember, ChatMember.chat_id == Chat.id)
            .where(ChatMember.user_id == user_id)
            .options(selectinload(Chat.members).selectinload(ChatMember.user))
            .order_by(Chat.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.scalars(stmt).unique().all())

    def find_direct_chat(self, user_a: int, user_b: int) -> Chat | None:
        """Return the existing 1:1 chat between two users, if any."""
        m1 = select(ChatMember.chat_id).where(ChatMember.user_id == user_a).subquery()
        m2 = select(ChatMember.chat_id).where(ChatMember.user_id == user_b).subquery()
        stmt = (
            select(Chat)
            .where(Chat.type == ChatType.DIRECT)
            .where(Chat.id.in_(select(m1.c.chat_id)))
            .where(Chat.id.in_(select(m2.c.chat_id)))
        )
        return self.db.scalars(stmt).first()

    def get_member(self, chat_id: int, user_id: int) -> ChatMember | None:
        stmt = select(ChatMember).where(
            and_(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id)
        )
        return self.db.scalars(stmt).first()

    def member_ids(self, chat_id: int) -> list[int]:
        stmt = select(ChatMember.user_id).where(ChatMember.chat_id == chat_id)
        return list(self.db.scalars(stmt).all())

    def add_member(self, member: ChatMember) -> ChatMember:
        self.db.add(member)
        self.db.flush()
        self.db.refresh(member)
        return member

    def remove_member(self, member: ChatMember) -> None:
        self.db.delete(member)
        self.db.flush()

    def count_for_user(self, user_id: int) -> int:
        stmt = (
            select(func.count())
            .select_from(ChatMember)
            .where(ChatMember.user_id == user_id)
        )
        return self.db.scalar(stmt) or 0
