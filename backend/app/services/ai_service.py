"""AI assistant service backed by Ollama (free, local LLM).

Talks to an Ollama server over HTTP. Keeps zero vendor lock-in: swap the base
URL/model via environment variables. The model is pulled lazily on first use so
the stack starts even before the model finishes downloading.
"""
import logging
import re

import httpx

from app.core.config import settings
from app.core.exceptions import AppException
from app.schemas.ai import AIChatRequest

logger = logging.getLogger(__name__)


class AIServiceError(AppException):
    status_code = 503
    detail = "AI assistant is unavailable"


class AIService:
    def __init__(self) -> None:
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    def _build_messages(self, req: AIChatRequest) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = [
            {"role": "system", "content": settings.OLLAMA_SYSTEM_PROMPT}
        ]
        messages.extend({"role": m.role, "content": m.content} for m in req.history)
        messages.append({"role": "user", "content": req.message})
        return messages

    async def chat(self, req: AIChatRequest) -> str:
        if not settings.OLLAMA_ENABLED:
            raise AIServiceError("AI assistant is disabled")

        payload = {
            "model": self.model,
            "messages": self._build_messages(req),
            "stream": False,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                if resp.status_code == 404:
                    # Model not present yet — pull it, then retry once.
                    await self._pull_model(client)
                    resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("message", {}).get("content", "").strip()
        except httpx.HTTPError as exc:
            logger.warning("Ollama request failed: %s", exc)
            raise AIServiceError(
                "The AI model is starting up or downloading. Please try again shortly."
            ) from exc

    async def safe_chat(self, req: AIChatRequest) -> str:
        """Like ``chat`` but never raises — returns a friendly fallback instead.

        Used by the auto-reply bot so a message always gets *some* response even
        when Ollama is still pulling the model or temporarily unavailable.
        """
        try:
            reply = await self.chat(req)
            return reply or "I'm not sure how to answer that yet."
        except AIServiceError as exc:
            return f"🤖 {exc.detail}"

    async def summarize(self, transcript: str) -> str:
        """Summarize a chat transcript into a few concise bullet points."""
        prompt = (
            "Summarize the following chat conversation in 3-4 short bullet points. "
            "Capture key topics, decisions and any action items. Be concise.\n\n"
            f"{transcript}"
        )
        return await self.safe_chat(AIChatRequest(message=prompt))

    async def suggest_replies(self, transcript: str) -> list[str]:
        """Propose up to 3 short, natural replies the user could send next."""
        prompt = (
            "You are helping a user reply in a chat. Read the conversation and "
            "write 3 short replies the user could send next.\n"
            "Rules: plain text only, no names, no speaker labels, no markdown, "
            "no numbering, no quotes. Each reply on its own line, max 12 words.\n\n"
            f"Conversation:\n{transcript}\n\nThree replies:"
        )
        try:
            text = await self.chat(AIChatRequest(message=prompt))
        except AIServiceError:
            return []
        suggestions: list[str] = []
        for line in text.splitlines():
            cleaned = line.strip()
            # Strip leading bullets / numbering.
            cleaned = re.sub(r"^[\s\d\.\)\-\*•]+", "", cleaned)
            # Strip a leading "name:" / "speaker:" label the model may echo.
            cleaned = re.sub(r"^[A-Za-z0-9_\- ]{1,20}:\s*", "", cleaned)
            # Strip markdown emphasis and stray quotes.
            cleaned = cleaned.replace("**", "").replace("*", "").strip().strip('"').strip()
            # Skip empties, headers (end with ':') and preamble lines.
            if (
                not cleaned
                or len(cleaned) < 2
                or cleaned.endswith(":")
                or re.match(r"^(here are|sure|certainly|option|reply)\b", cleaned, re.I)
            ):
                continue
            suggestions.append(cleaned)
        return suggestions[:3]

    async def _pull_model(self, client: httpx.AsyncClient) -> None:
        logger.info("Pulling Ollama model '%s'...", self.model)
        # Streamed pull; we just drain the stream until completion.
        async with client.stream(
            "POST",
            f"{self.base_url}/api/pull",
            json={"model": self.model, "stream": True},
            timeout=None,
        ) as resp:
            resp.raise_for_status()
            async for _ in resp.aiter_lines():
                pass
        logger.info("Model '%s' ready.", self.model)
