"""User and profile data access."""
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.models.profile import Profile
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_with_profile(self, id: int) -> User | None:
        stmt = select(User).options(selectinload(User.profile)).where(User.id == id)
        return self.db.scalars(stmt).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalars(select(User).where(User.email == email)).first()

    def get_by_username(self, username: str) -> User | None:
        return self.db.scalars(select(User).where(User.username == username)).first()

    def get_by_identifier(self, identifier: str) -> User | None:
        stmt = (
            select(User)
            .options(selectinload(User.profile))
            .where(or_(User.email == identifier, User.username == identifier))
        )
        return self.db.scalars(stmt).first()

    def search(self, query: str, *, exclude_user_id: int, limit: int = 20) -> list[User]:
        pattern = f"%{query.lower()}%"
        stmt = (
            select(User)
            .options(selectinload(User.profile))
            .where(User.id != exclude_user_id)
            .where(User.is_active.is_(True))
            .where(or_(User.username.ilike(pattern), User.email.ilike(pattern)))
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())


class ProfileRepository(BaseRepository[Profile]):
    model = Profile

    def get_by_user_id(self, user_id: int) -> Profile | None:
        return self.db.scalars(select(Profile).where(Profile.user_id == user_id)).first()
