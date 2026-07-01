"""Chat and group orchestration: create direct chats, manage groups/members."""
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.base import ChatType, MemberRole
from app.models.chat import Chat, ChatMember
from app.repositories.chat_repository import ChatRepository
from app.repositories.user_repository import UserRepository
from app.schemas.chat import GroupCreate, GroupUpdate


class ChatService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.chats = ChatRepository(db)
        self.users = UserRepository(db)

    # ----- Authorization helpers -------------------------------------------
    def require_member(self, chat_id: int, user_id: int) -> ChatMember:
        member = self.chats.get_member(chat_id, user_id)
        if not member:
            raise ForbiddenError("You are not a member of this chat")
        return member

    def require_admin(self, chat_id: int, user_id: int) -> ChatMember:
        member = self.require_member(chat_id, user_id)
        if member.role != MemberRole.ADMIN:
            raise ForbiddenError("Admin permission required")
        return member

    # ----- Direct chats -----------------------------------------------------
    def get_or_create_direct(self, user_id: int, target_user_id: int) -> Chat:
        if user_id == target_user_id:
            raise ConflictError("Cannot start a chat with yourself")
        if not self.users.get(target_user_id):
            raise NotFoundError("Target user not found")

        existing = self.chats.find_direct_chat(user_id, target_user_id)
        if existing:
            return self.chats.get_with_members(existing.id)  # type: ignore[return-value]

        chat = Chat(type=ChatType.DIRECT, created_by=user_id)
        self.chats.add(chat)
        for uid in (user_id, target_user_id):
            self.chats.add_member(ChatMember(chat_id=chat.id, user_id=uid))
        self.db.commit()
        return self.chats.get_with_members(chat.id)  # type: ignore[return-value]

    # ----- Listing ----------------------------------------------------------
    def list_for_user(self, user_id: int, *, limit: int, offset: int) -> list[Chat]:
        return self.chats.list_for_user(user_id, limit=limit, offset=offset)

    def get(self, chat_id: int, user_id: int) -> Chat:
        self.require_member(chat_id, user_id)
        chat = self.chats.get_with_members(chat_id)
        if not chat:
            raise NotFoundError("Chat not found")
        return chat

    # ----- Groups -----------------------------------------------------------
    def create_group(self, owner_id: int, data: GroupCreate) -> Chat:
        chat = Chat(
            type=ChatType.GROUP,
            name=data.name,
            description=data.description,
            created_by=owner_id,
        )
        self.chats.add(chat)
        # Owner becomes admin.
        self.chats.add_member(
            ChatMember(chat_id=chat.id, user_id=owner_id, role=MemberRole.ADMIN)
        )
        for uid in set(data.member_ids) - {owner_id}:
            if self.users.get(uid):
                self.chats.add_member(ChatMember(chat_id=chat.id, user_id=uid))
        self.db.commit()
        return self.chats.get_with_members(chat.id)  # type: ignore[return-value]

    def update_group(self, chat_id: int, user_id: int, data: GroupUpdate) -> Chat:
        chat = self.chats.get_with_members(chat_id)
        if not chat or chat.type != ChatType.GROUP:
            raise NotFoundError("Group not found")
        self.require_admin(chat_id, user_id)
        if data.name is not None:
            chat.name = data.name
        if data.description is not None:
            chat.description = data.description
        if data.avatar_url is not None:
            chat.avatar_url = data.avatar_url
        self.db.commit()
        return self.chats.get_with_members(chat_id)  # type: ignore[return-value]

    def delete_group(self, chat_id: int, user_id: int) -> None:
        chat = self.chats.get(chat_id)
        if not chat or chat.type != ChatType.GROUP:
            raise NotFoundError("Group not found")
        self.require_admin(chat_id, user_id)
        self.chats.delete(chat)
        self.db.commit()

    def add_member(self, chat_id: int, actor_id: int, new_user_id: int) -> Chat:
        self.require_admin(chat_id, actor_id)
        if not self.users.get(new_user_id):
            raise NotFoundError("User not found")
        if self.chats.get_member(chat_id, new_user_id):
            raise ConflictError("User is already a member")
        self.chats.add_member(ChatMember(chat_id=chat_id, user_id=new_user_id))
        self.db.commit()
        return self.chats.get_with_members(chat_id)  # type: ignore[return-value]

    def remove_member(self, chat_id: int, actor_id: int, target_id: int) -> Chat:
        self.require_admin(chat_id, actor_id)
        member = self.chats.get_member(chat_id, target_id)
        if not member:
            raise NotFoundError("Member not found")
        self.chats.remove_member(member)
        self.db.commit()
        return self.chats.get_with_members(chat_id)  # type: ignore[return-value]

    def member_ids(self, chat_id: int) -> list[int]:
        return self.chats.member_ids(chat_id)
