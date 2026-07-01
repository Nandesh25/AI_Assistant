"""Authentication business logic: register, login, refresh, logout.

The service owns all auth rules and never touches HTTP concerns. Refresh tokens
are stored hashed and rotated on every refresh (one-time use) to limit blast
radius if a token leaks.
"""
import hashlib
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    REFRESH_TOKEN_TYPE,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.profile import Profile
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenPair


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.tokens = RefreshTokenRepository(db)

    def register(self, data: RegisterRequest) -> tuple[User, TokenPair]:
        if self.users.get_by_email(data.email):
            raise ConflictError("Email already registered")
        if self.users.get_by_username(data.username):
            raise ConflictError("Username already taken")

        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
        )
        user.profile = Profile(full_name=data.full_name)
        self.users.add(user)
        tokens = self._issue_tokens(user)
        self.db.commit()
        self.db.refresh(user)
        return user, tokens

    def login(self, data: LoginRequest) -> tuple[User, TokenPair]:
        user = self.users.get_by_identifier(data.identifier)
        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Invalid credentials")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")
        tokens = self._issue_tokens(user)
        self.db.commit()
        return user, tokens

    def refresh(self, refresh_token: str) -> TokenPair:
        try:
            payload = decode_token(refresh_token, expected_type=REFRESH_TOKEN_TYPE)
        except Exception as exc:  # noqa: BLE001
            raise UnauthorizedError("Invalid refresh token") from exc

        stored = self.tokens.get_active_by_hash(_hash_token(refresh_token))
        if not stored:
            raise UnauthorizedError("Refresh token expired or revoked")

        user = self.users.get(int(payload["sub"]))
        if not user or not user.is_active:
            raise UnauthorizedError("User no longer valid")

        # Rotate: revoke the used token, issue a fresh pair.
        stored.revoked = True
        tokens = self._issue_tokens(user)
        self.db.commit()
        return tokens

    def logout(self, user_id: int) -> None:
        self.tokens.revoke_all_for_user(user_id)
        self.db.commit()

    def change_password(self, user: User, current: str, new: str) -> None:
        if not verify_password(current, user.password_hash):
            raise UnauthorizedError("Current password is incorrect")
        user.password_hash = hash_password(new)
        # Force re-login everywhere after a password change.
        self.tokens.revoke_all_for_user(user.id)
        self.db.commit()

    def _issue_tokens(self, user: User) -> TokenPair:
        access = create_access_token(user.id, user.role.value)
        refresh = create_refresh_token(user.id)
        self.tokens.add(
            RefreshToken(
                user_id=user.id,
                token_hash=_hash_token(refresh),
                expires_at=datetime.now(UTC)
                + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            )
        )
        return TokenPair(access_token=access, refresh_token=refresh)
