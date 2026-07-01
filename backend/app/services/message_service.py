"""Message business logic: send, edit, delete, status transitions, search.

Enforces the core rule "sender must be a chat member" and creates per-recipient
status rows so read/delivery receipts work in both direct and group chats.
"""
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.base import MessageStatusEnum
from app.models.message import Message
from app.repositories.chat_repository import ChatRepository
from app.repositories.message_repository import MessageRepository
from app.schemas.message import MessageCreate, MessageUpdate


class MessageService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.messages = MessageRepository(db)
        self.chats = ChatRepository(db)

    def _ensure_member(self, chat_id: int, user_id: int) -> None:
        if not self.chats.get_member(chat_id, user_id):
            raise ForbiddenError("You are not a member of this chat")

    def list_messages(
        self, chat_id: int, user_id: int, *, limit: int, before_id: int | None
    ) -> list[Message]:
        self._ensure_member(chat_id, user_id)
        return self.messages.list_for_chat(chat_id, limit=limit, before_id=before_id)

    def send(self, chat_id: int, sender_id: int, data: MessageCreate) -> Message:
        self._ensure_member(chat_id, sender_id)
        message = Message(
            chat_id=chat_id,
            sender_id=sender_id,
            body=data.body,
            reply_to_id=data.reply_to_id,
            forwarded_from_id=data.forwarded_from_id,
        )
        self.messages.add(message)

        # Status rows for everyone except the sender.
        recipients = [uid for uid in self.chats.member_ids(chat_id) if uid != sender_id]
        self.messages.create_statuses(message.id, recipients)
        self.db.commit()
        return self.messages.get_with_relations(message.id)  # type: ignore[return-value]

    def edit(self, message_id: int, user_id: int, data: MessageUpdate) -> Message:
        message = self.messages.get(message_id)
        if not message or message.is_deleted:
            raise NotFoundError("Message not found")
        if message.sender_id != user_id:
            raise ForbiddenError("You can only edit your own messages")
        message.body = data.body
        message.is_edited = True
        self.db.commit()
        return self.messages.get_with_relations(message_id)  # type: ignore[return-value]

    def delete(self, message_id: int, user_id: int) -> None:
        message = self.messages.get(message_id)
        if not message:
            raise NotFoundError("Message not found")
        if message.sender_id != user_id:
            raise ForbiddenError("You can only delete your own messages")
        # Soft delete keeps thread integrity (replies still resolve).
        message.is_deleted = True
        message.body = None
        self.db.commit()

    def update_status(
        self, message_id: int, user_id: int, status: MessageStatusEnum
    ) -> None:
        message = self.messages.get(message_id)
        if not message:
            raise NotFoundError("Message not found")
        self._ensure_member(message.chat_id, user_id)
        record = self.messages.get_status(message_id, user_id)
        if record and record.status != MessageStatusEnum.READ:
            record.status = status
            self.db.commit()

    def search(self, user_id: int, query: str) -> list[Message]:
        if not query.strip():
            return []
        return self.messages.search_in_user_chats(user_id, query)

    def get_chat_id(self, message_id: int) -> int:
        message = self.messages.get(message_id)
        if not message:
            raise NotFoundError("Message not found")
        return message.chat_id
