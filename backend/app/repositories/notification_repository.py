"""Notification data access."""
from sqlalchemy import func, select

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    def list_for_user(
        self, user_id: int, *, limit: int = 50, offset: int = 0
    ) -> list[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.scalars(stmt).all())

    def unread_count(self, user_id: int) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read.is_(False))
        )
        return self.db.scalar(stmt) or 0

    def mark_all_read(self, user_id: int) -> None:
        for n in self.db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read.is_(False))
        ):
            n.is_read = True
        self.db.flush()
