"""AI auto-reply bot.

Seeds a normal ``User`` that represents the AI assistant, and provides the
trigger that turns a human's direct message into an AI-generated reply. The bot
is an ordinary chat member, so it reuses the entire existing pipeline
(persistence + WebSocket broadcast) — it just happens to be answered by an LLM.
"""
import logging
import secrets

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.base import ChatType
from app.models.profile import Profile
from app.models.user import User
from app.repositories.chat_repository import ChatRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository
from app.schemas.ai import AIChatRequest, AIMessage
from app.schemas.message import MessageCreate, MessageOut
from app.services.ai_service import AIService
from app.services.message_service import MessageService
from app.websocket.connection_manager import manager

logger = logging.getLogger(__name__)

# How many prior messages to feed the model for context.
HISTORY_LIMIT = 20


def get_or_create_bot(db: Session) -> User:
    """Return the AI bot user, creating it on first call (idempotent)."""
    users = UserRepository(db)
    bot = users.get_by_username(settings.AI_BOT_USERNAME)
    if bot:
        return bot

    bot = User(
        email=settings.AI_BOT_EMAIL,
        username=settings.AI_BOT_USERNAME,
        # Random unusable password — the bot never logs in.
        password_hash=hash_password(secrets.token_urlsafe(32)),
    )
    bot.profile = Profile(
        full_name="AI Assistant",
        bio="I reply automatically using a local LLM (Ollama). Free and private.",
    )
    users.add(bot)
    db.commit()
    db.refresh(bot)
    logger.info("Seeded AI bot user id=%s", bot.id)
    return bot


def seed_bot() -> None:
    """Startup hook: ensure the bot user exists."""
    db = SessionLocal()
    try:
        get_or_create_bot(db)
    finally:
        db.close()


async def trigger_bot_reply(chat_id: int, sender_id: int) -> None:
    """If ``chat_id`` is a direct chat with the bot, generate and post a reply.

    Designed to run as a fire-and-forget ``asyncio`` task so the human's send
    returns immediately; the reply arrives over WebSocket moments later.
    """
    db = SessionLocal()
    try:
        chat = ChatRepository(db).get_with_members(chat_id)
        if not chat or chat.type != ChatType.DIRECT:
            return

        bot = UserRepository(db).get_by_username(settings.AI_BOT_USERNAME)
        member_ids = [m.user_id for m in chat.members]
        if not bot or bot.id not in member_ids or sender_id == bot.id:
            return  # not a bot chat, or the bot itself sent the message

        # Build conversation history (oldest → newest) for the model.
        recent = MessageRepository(db).list_for_chat(chat_id, limit=HISTORY_LIMIT)
        turns = [
            AIMessage(
                role="assistant" if m.sender_id == bot.id else "user",
                content=m.body,
            )
            for m in reversed(recent)
            if m.body
        ]
        if not turns:
            return
        prompt = turns[-1].content

        # Show a typing indicator while the model works.
        await manager.broadcast(
            member_ids,
            {
                "type": "typing",
                "payload": {"chat_id": chat_id, "user_id": bot.id, "is_typing": True},
            },
        )

        reply_text = await AIService().safe_chat(
            AIChatRequest(history=turns[:-1], message=prompt)
        )

        bot_message = MessageService(db).send(
            chat_id, bot.id, MessageCreate(body=reply_text)
        )
        out = MessageOut.model_validate(bot_message)
        members = ChatRepository(db).member_ids(chat_id)
    except Exception:  # noqa: BLE001 — never let a bot failure crash the caller
        logger.exception("Bot reply failed for chat %s", chat_id)
        return
    finally:
        db.close()

    await manager.broadcast(
        members,
        {"type": "typing", "payload": {"chat_id": chat_id, "user_id": bot.id, "is_typing": False}},
    )
    await manager.broadcast(
        members, {"type": "message:new", "payload": out.model_dump(mode="json")}
    )
