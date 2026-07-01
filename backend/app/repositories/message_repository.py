"""Message and message-status data access."""
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload

from app.models.message import Message, MessageStatus
from app.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    model = Message

    def get_with_relations(self, message_id: int) -> Message | None:
        stmt = (
            select(Message)
            .options(
                selectinload(Message.sender),
                selectinload(Message.files),
            )
            .where(Message.id == message_id)
        )
        return self.db.scalars(stmt).first()

    def list_for_chat(
        self, chat_id: int, *, limit: int = 30, before_id: int | None = None
    ) -> list[Message]:
        """Newest-first page, optionally before a given message id (infinite scroll)."""
        stmt = (
            select(Message)
            .options(selectinload(Message.sender), selectinload(Message.files))
            .where(Message.chat_id == chat_id)
        )
        if before_id is not None:
            stmt = stmt.where(Message.id < before_id)
        stmt = stmt.order_by(Message.id.desc()).limit(limit)
        return list(self.db.scalars(stmt).all())

    def search_in_user_chats(
        self, user_id: int, query: str, *, limit: int = 30
    ) -> list[Message]:
        from app.models.chat import ChatMember

        pattern = f"%{query.lower()}%"
        stmt = (
            select(Message)
            .join(ChatMember, ChatMember.chat_id == Message.chat_id)
            .where(ChatMember.user_id == user_id)
            .where(Message.is_deleted.is_(False))
            .where(Message.body.ilike(pattern))
            .options(selectinload(Message.sender))
            .order_by(Message.id.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).unique().all())

    def create_statuses(self, message_id: int, recipient_ids: list[int]) -> None:
        for uid in recipient_ids:
            self.db.add(MessageStatus(message_id=message_id, user_id=uid))
        self.db.flush()

    def get_status(self, message_id: int, user_id: int) -> MessageStatus | None:
        stmt = select(MessageStatus).where(
            and_(MessageStatus.message_id == message_id, MessageStatus.user_id == user_id)
        )
        return self.db.scalars(stmt).first()

    def unread_count(self, chat_id: int, user_id: int) -> int:
        from app.models.base import MessageStatusEnum

        stmt = (
            select(func.count())
            .select_from(MessageStatus)
            .join(Message, Message.id == MessageStatus.message_id)
            .where(Message.chat_id == chat_id)
            .where(MessageStatus.user_id == user_id)
            .where(MessageStatus.status != MessageStatusEnum.READ)
        )
        return self.db.scalar(stmt) or 0
