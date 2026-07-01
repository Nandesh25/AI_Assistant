"""In-memory WebSocket connection manager.

Tracks active sockets per user and provides targeted delivery plus presence.
A single user may have several connections (multiple tabs/devices), so we keep
a *set* of sockets per user id.

NOTE: This is single-instance only. To scale horizontally, back the presence
map and broadcast with Redis pub/sub — that is the documented next step and is
intentionally deferred to keep the initial setup free-tier and simple.
"""
import asyncio
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, set()).add(websocket)
        logger.info("WS connected: user=%s total_users=%d", user_id, len(self._connections))

    async def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(user_id)
            if sockets:
                sockets.discard(websocket)
                if not sockets:
                    self._connections.pop(user_id, None)
        logger.info("WS disconnected: user=%s", user_id)

    def is_online(self, user_id: int) -> bool:
        return user_id in self._connections

    def online_users(self) -> list[int]:
        return list(self._connections.keys())

    async def send_to_user(self, user_id: int, message: dict) -> None:
        """Deliver a message to every socket of a single user."""
        sockets = list(self._connections.get(user_id, set()))
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:  # noqa: BLE001 — drop broken sockets defensively
                await self.disconnect(user_id, ws)

    async def broadcast(self, user_ids: list[int], message: dict) -> None:
        """Deliver a message to a set of users (e.g. all members of a chat)."""
        await asyncio.gather(
            *(self.send_to_user(uid, message) for uid in set(user_ids)),
            return_exceptions=True,
        )


# Process-wide singleton.
manager = ConnectionManager()
