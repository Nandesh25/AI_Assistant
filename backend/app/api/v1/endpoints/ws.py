"""WebSocket endpoint and real-time event handlers.

Auth is via a JWT passed as the ``token`` query parameter (browsers cannot set
custom headers on the WebSocket handshake). On connect we announce presence; on
each frame we validate, persist via services, then broadcast.
"""
import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.database import SessionLocal
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.models.base import MessageStatusEnum
from app.schemas.message import MessageCreate, MessageOut
from app.services.bot_service import trigger_bot_reply
from app.services.chat_service import ChatService
from app.services.message_service import MessageService
from app.websocket.connection_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


def _authenticate(token: str) -> int | None:
    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None


async def _announce_presence(user_id: int, online: bool) -> None:
    """Tell the user's chat partners that they came online / went offline."""
    db = SessionLocal()
    try:
        chat_service = ChatService(db)
        peer_ids: set[int] = set()
        for chat in chat_service.list_for_user(user_id, limit=200, offset=0):
            peer_ids.update(chat_service.member_ids(chat.id))
        peer_ids.discard(user_id)
    finally:
        db.close()
    await manager.broadcast(
        list(peer_ids),
        {"type": "presence", "payload": {"user_id": user_id, "online": online}},
    )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = "") -> None:
    user_id = _authenticate(token)
    if user_id is None:
        await websocket.close(code=4401)  # custom: unauthorized
        return

    await manager.connect(user_id, websocket)
    await websocket.send_json(
        {"type": "presence:init", "payload": {"online_users": manager.online_users()}}
    )
    await _announce_presence(user_id, online=True)

    try:
        while True:
            frame = await websocket.receive_json()
            await _handle_frame(user_id, frame)
    except WebSocketDisconnect:
        pass
    except Exception:  # noqa: BLE001
        logger.exception("WebSocket error for user %s", user_id)
    finally:
        await manager.disconnect(user_id, websocket)
        await _announce_presence(user_id, online=False)


async def _handle_frame(user_id: int, frame: dict) -> None:
    event_type = frame.get("type")
    payload = frame.get("payload", {})

    if event_type == "message:send":
        await _on_send(user_id, payload)
    elif event_type == "message:typing":
        await _on_typing(user_id, payload)
    elif event_type in ("message:read", "message:delivered"):
        await _on_status(user_id, event_type, payload)
    else:
        logger.warning("Unknown WS event: %s", event_type)


async def _on_send(user_id: int, payload: dict) -> None:
    chat_id = payload.get("chat_id")
    if not chat_id:
        return
    db = SessionLocal()
    try:
        data = MessageCreate(
            body=payload.get("body"),
            reply_to_id=payload.get("reply_to_id"),
            forwarded_from_id=payload.get("forwarded_from_id"),
        )
        message = MessageService(db).send(chat_id, user_id, data)
        out = MessageOut.model_validate(message)
        member_ids = ChatService(db).member_ids(chat_id)
    finally:
        db.close()
    await manager.broadcast(
        member_ids, {"type": "message:new", "payload": out.model_dump(mode="json")}
    )
    # Trigger an AI auto-reply if this is a direct chat with the bot.
    asyncio.create_task(trigger_bot_reply(chat_id, user_id))


async def _on_typing(user_id: int, payload: dict) -> None:
    chat_id = payload.get("chat_id")
    if not chat_id:
        return
    db = SessionLocal()
    try:
        member_ids = [
            uid for uid in ChatService(db).member_ids(chat_id) if uid != user_id
        ]
    finally:
        db.close()
    await manager.broadcast(
        member_ids,
        {
            "type": "typing",
            "payload": {
                "chat_id": chat_id,
                "user_id": user_id,
                "is_typing": payload.get("is_typing", True),
            },
        },
    )


async def _on_status(user_id: int, event_type: str, payload: dict) -> None:
    message_id = payload.get("message_id")
    if not message_id:
        return
    status = (
        MessageStatusEnum.READ
        if event_type == "message:read"
        else MessageStatusEnum.DELIVERED
    )
    db = SessionLocal()
    try:
        svc = MessageService(db)
        svc.update_status(message_id, user_id, status)
        chat_id = svc.get_chat_id(message_id)
        member_ids = ChatService(db).member_ids(chat_id)
    finally:
        db.close()
    await manager.broadcast(
        member_ids,
        {
            "type": "message:status",
            "payload": {"message_id": message_id, "user_id": user_id, "status": status.value},
        },
    )
