"""User profile management and user search."""
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.profile import Profile
from app.models.user import User
from app.repositories.user_repository import ProfileRepository, UserRepository
from app.schemas.user import ProfileUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.profiles = ProfileRepository(db)

    def get(self, user_id: int) -> User:
        user = self.users.get_with_profile(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def search(self, query: str, *, current_user_id: int) -> list[User]:
        if not query.strip():
            return []
        return self.users.search(query, exclude_user_id=current_user_id)

    def update_profile(self, user: User, data: ProfileUpdate) -> User:
        profile = self.profiles.get_by_user_id(user.id)
        if not profile:
            profile = Profile(user_id=user.id)
            self.db.add(profile)
        if data.full_name is not None:
            profile.full_name = data.full_name
        if data.bio is not None:
            profile.bio = data.bio
        self.db.commit()
        return self.get(user.id)

    def set_avatar(self, user: User, avatar_url: str) -> User:
        profile = self.profiles.get_by_user_id(user.id)
        if not profile:
            profile = Profile(user_id=user.id)
            self.db.add(profile)
        profile.avatar_url = avatar_url
        self.db.commit()
        return self.get(user.id)
