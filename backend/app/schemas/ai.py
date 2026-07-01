"""AI assistant (Ollama) schemas."""
from typing import Literal

from pydantic import BaseModel, Field


class AIMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=8000)


class AIChatRequest(BaseModel):
    # Prior turns for context (optional) + the new user message.
    history: list[AIMessage] = Field(default_factory=list, max_length=20)
    message: str = Field(min_length=1, max_length=8000)


class AIChatResponse(BaseModel):
    reply: str
    model: str


class ChatRefRequest(BaseModel):
    chat_id: int


class SummaryResponse(BaseModel):
    summary: str


class SuggestionsResponse(BaseModel):
    suggestions: list[str]
