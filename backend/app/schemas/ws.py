"""WebSocket event schemas — the real-time wire protocol."""
from typing import Any, Literal

from pydantic import BaseModel


class WSIncoming(BaseModel):
    """Envelope for messages the client sends over the socket."""

    type: Literal[
        "message:send",
        "message:typing",
        "message:read",
        "message:delivered",
    ]
    payload: dict[str, Any]


class WSOutgoing(BaseModel):
    """Envelope for messages the server pushes to clients."""

    type: str
    payload: dict[str, Any]
