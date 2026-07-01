"""User and profile endpoints."""
from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import AvatarUpdate, ProfileUpdate, UserOut, UserPublic
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search", response_model=list[UserPublic])
def search_users(
    q: str, current_user: CurrentUser, db: DbSession, _limit: int = Query(20, ge=1, le=50)
) -> list[UserPublic]:
    users = UserService(db).search(q, current_user_id=current_user.id)
    return [UserPublic.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, current_user: CurrentUser, db: DbSession) -> UserOut:
    return UserOut.model_validate(UserService(db).get(user_id))


@router.put("/profile", response_model=UserOut)
def update_profile(
    data: ProfileUpdate, current_user: CurrentUser, db: DbSession
) -> UserOut:
    return UserOut.model_validate(UserService(db).update_profile(current_user, data))


@router.put("/avatar", response_model=UserOut)
def update_avatar(
    data: AvatarUpdate, current_user: CurrentUser, db: DbSession
) -> UserOut:
    return UserOut.model_validate(UserService(db).set_avatar(current_user, data.avatar_url))
