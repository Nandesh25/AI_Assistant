"""Notification endpoints."""
from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession, PaginationParams
from app.schemas.common import MessageResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    current_user: CurrentUser, db: DbSession, page: PaginationParams
) -> list[dict]:
    notifications = NotificationService(db).list(
        current_user.id, limit=page.limit, offset=page.offset
    )
    return [
        {
            "id": n.id,
            "type": n.type,
            "payload": n.payload,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


@router.get("/unread-count")
def unread_count(current_user: CurrentUser, db: DbSession) -> dict[str, int]:
    return {"count": NotificationService(db).unread_count(current_user.id)}


@router.post("/read-all", response_model=MessageResponse)
def mark_all_read(current_user: CurrentUser, db: DbSession) -> MessageResponse:
    NotificationService(db).mark_all_read(current_user.id)
    return MessageResponse(detail="All notifications marked as read")
