"""Chat endpoints (direct conversations + listing)."""
from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession, PaginationParams
from app.schemas.chat import ChatOut, DirectChatCreate
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("", response_model=list[ChatOut])
def list_chats(
    current_user: CurrentUser, db: DbSession, page: PaginationParams
) -> list[ChatOut]:
    chats = ChatService(db).list_for_user(
        current_user.id, limit=page.limit, offset=page.offset
    )
    return [ChatOut.model_validate(c) for c in chats]


@router.post("", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
def create_direct_chat(
    data: DirectChatCreate, current_user: CurrentUser, db: DbSession
) -> ChatOut:
    chat = ChatService(db).get_or_create_direct(current_user.id, data.target_user_id)
    return ChatOut.model_validate(chat)


@router.get("/{chat_id}", response_model=ChatOut)
def get_chat(chat_id: int, current_user: CurrentUser, db: DbSession) -> ChatOut:
    return ChatOut.model_validate(ChatService(db).get(chat_id, current_user.id))
