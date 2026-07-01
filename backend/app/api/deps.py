"""Reusable FastAPI dependencies (the DI wiring).

These translate the HTTP request into domain objects: the current authenticated
user, role checks, and pagination. Keeping them here makes routers thin.
"""
from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.models.base import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None:
        raise UnauthorizedError("Missing authentication token")
    try:
        payload = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
    except JWTError as exc:
        raise UnauthorizedError("Invalid or expired token") from exc

    user = UserRepository(db).get_with_profile(int(payload["sub"]))
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    """Role guard for admin-only endpoints."""
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin access required")
    return user


AdminUser = Annotated[User, Depends(require_admin)]


class Pagination:
    def __init__(
        self,
        limit: Annotated[int, Query(ge=1, le=100)] = 50,
        offset: Annotated[int, Query(ge=0)] = 0,
    ) -> None:
        self.limit = limit
        self.offset = offset


PaginationParams = Annotated[Pagination, Depends(Pagination)]
