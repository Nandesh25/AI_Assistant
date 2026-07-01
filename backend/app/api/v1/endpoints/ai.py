"""AI assistant (Ollama) endpoints: chat, summarize, smart replies."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.models.message import Message
from app.repositories.message_repository import MessageRepository
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    ChatRefRequest,
    SuggestionsResponse,
    SummaryResponse,
)
from app.services.ai_service import AIService
from app.services.chat_service import ChatService

router = APIRouter(prefix="/ai", tags=["ai"])


def _build_transcript(messages: list[Message]) -> str:
    """Format messages (newest-first input) as 'name: text', oldest first."""
    lines: list[str] = []
    for m in reversed(messages):
        if m.is_deleted or not m.body:
            continue
        name = m.sender.username if m.sender else "user"
        lines.append(f"{name}: {m.body}")
    return "\n".join(lines)


@router.get("/status")
def ai_status(_: CurrentUser) -> dict:
    return {"enabled": settings.OLLAMA_ENABLED, "model": settings.OLLAMA_MODEL}


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(data: AIChatRequest, _: CurrentUser) -> AIChatResponse:
    reply = await AIService().chat(data)
    return AIChatResponse(reply=reply, model=settings.OLLAMA_MODEL)


@router.post("/summarize", response_model=SummaryResponse)
async def summarize(
    data: ChatRefRequest, current_user: CurrentUser, db: DbSession
) -> SummaryResponse:
    # Authorize: caller must belong to the chat.
    ChatService(db).require_member(data.chat_id, current_user.id)
    messages = MessageRepository(db).list_for_chat(data.chat_id, limit=50)
    transcript = _build_transcript(messages)
    if not transcript.strip():
        return SummaryResponse(summary="There are no messages to summarize yet.")
    summary = await AIService().summarize(transcript)
    return SummaryResponse(summary=summary)


@router.post("/suggest-replies", response_model=SuggestionsResponse)
async def suggest_replies(
    data: ChatRefRequest, current_user: CurrentUser, db: DbSession
) -> SuggestionsResponse:
    ChatService(db).require_member(data.chat_id, current_user.id)
    messages = MessageRepository(db).list_for_chat(data.chat_id, limit=12)
    transcript = _build_transcript(messages)
    if not transcript.strip():
        return SuggestionsResponse(suggestions=[])
    suggestions = await AIService().suggest_replies(transcript)
    return SuggestionsResponse(suggestions=suggestions)
