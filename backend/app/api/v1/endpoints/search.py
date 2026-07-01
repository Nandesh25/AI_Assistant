"""Unified search across users, chats, and messages."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.chat import ChatOut
from app.schemas.message import MessageOut
from app.schemas.user import UserPublic
from app.services.chat_service import ChatService
from app.services.message_service import MessageService
from app.services.user_service import UserService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(q: str, current_user: CurrentUser, db: DbSession) -> dict:
    users = UserService(db).search(q, current_user_id=current_user.id)
    messages = MessageService(db).search(current_user.id, q)
    # Filter the user's own chats by group name match.
    chats = [
        c
        for c in ChatService(db).list_for_user(current_user.id, limit=100, offset=0)
        if c.name and q.lower() in c.name.lower()
    ]
    return {
        "users": [UserPublic.model_validate(u).model_dump() for u in users],
        "messages": [MessageOut.model_validate(m).model_dump(mode="json") for m in messages],
        "chats": [ChatOut.model_validate(c).model_dump(mode="json") for c in chats],
    }
