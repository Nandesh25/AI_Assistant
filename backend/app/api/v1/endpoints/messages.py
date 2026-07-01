"""Message endpoints. Sending also broadcasts to online members in real time."""
import asyncio

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import MessageResponse
from app.schemas.message import MessageCreate, MessageOut, MessageUpdate
from app.services.bot_service import trigger_bot_reply
from app.services.chat_service import ChatService
from app.services.message_service import MessageService
from app.websocket.connection_manager import manager

router = APIRouter(tags=["messages"])


@router.get("/chats/{chat_id}/messages", response_model=list[MessageOut])
def list_messages(
    chat_id: int,
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(30, ge=1, le=100),
    before_id: int | None = Query(None, ge=1),
) -> list[MessageOut]:
    messages = MessageService(db).list_messages(
        chat_id, current_user.id, limit=limit, before_id=before_id
    )
    return [MessageOut.model_validate(m) for m in messages]


@router.post(
    "/chats/{chat_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    chat_id: int, data: MessageCreate, current_user: CurrentUser, db: DbSession
) -> MessageOut:
    message = MessageService(db).send(chat_id, current_user.id, data)
    out = MessageOut.model_validate(message)
    # Persist-then-broadcast: notify all members of the chat.
    member_ids = ChatService(db).member_ids(chat_id)
    await manager.broadcast(
        member_ids, {"type": "message:new", "payload": out.model_dump(mode="json")}
    )
    # If this is a direct chat with the AI bot, generate a reply in the
    # background so the response returns immediately.
    asyncio.create_task(trigger_bot_reply(chat_id, current_user.id))
    return out


@router.put("/messages/{message_id}", response_model=MessageOut)
async def edit_message(
    message_id: int, data: MessageUpdate, current_user: CurrentUser, db: DbSession
) -> MessageOut:
    svc = MessageService(db)
    message = svc.edit(message_id, current_user.id, data)
    out = MessageOut.model_validate(message)
    member_ids = ChatService(db).member_ids(message.chat_id)
    await manager.broadcast(
        member_ids, {"type": "message:edited", "payload": out.model_dump(mode="json")}
    )
    return out


@router.delete("/messages/{message_id}", response_model=MessageResponse)
async def delete_message(
    message_id: int, current_user: CurrentUser, db: DbSession
) -> MessageResponse:
    svc = MessageService(db)
    chat_id = svc.get_chat_id(message_id)
    svc.delete(message_id, current_user.id)
    member_ids = ChatService(db).member_ids(chat_id)
    await manager.broadcast(
        member_ids,
        {"type": "message:deleted", "payload": {"id": message_id, "chat_id": chat_id}},
    )
    return MessageResponse(detail="Message deleted")
