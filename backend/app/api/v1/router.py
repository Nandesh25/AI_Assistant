"""Aggregate router that mounts every v1 endpoint module."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai,
    auth,
    chats,
    files,
    groups,
    messages,
    notifications,
    search,
    users,
    ws,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(chats.router)
api_router.include_router(messages.router)
api_router.include_router(groups.router)
api_router.include_router(files.router)
api_router.include_router(notifications.router)
api_router.include_router(search.router)
api_router.include_router(ai.router)

# WebSocket is mounted without the REST prefix (handled in main).
ws_router = ws.router
