"""Notification business logic."""
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = NotificationRepository(db)

    def create(self, user_id: int, type_: str, payload: dict) -> Notification:
        notification = Notification(user_id=user_id, type=type_, payload=payload)
        self.repo.add(notification)
        self.db.commit()
        return notification

    def list(self, user_id: int, *, limit: int, offset: int) -> list[Notification]:
        return self.repo.list_for_user(user_id, limit=limit, offset=offset)

    def unread_count(self, user_id: int) -> int:
        return self.repo.unread_count(user_id)

    def mark_all_read(self, user_id: int) -> None:
        self.repo.mark_all_read(user_id)
        self.db.commit()
