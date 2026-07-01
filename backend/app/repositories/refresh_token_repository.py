"""Refresh token data access."""
from datetime import UTC, datetime

from sqlalchemy import select

from app.models.refresh_token import RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    model = RefreshToken

    def get_active_by_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = (
            select(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .where(RefreshToken.revoked.is_(False))
            .where(RefreshToken.expires_at > datetime.now(UTC))
        )
        return self.db.scalars(stmt).first()

    def revoke_all_for_user(self, user_id: int) -> None:
        for token in self.db.scalars(
            select(RefreshToken).where(RefreshToken.user_id == user_id)
        ):
            token.revoked = True
        self.db.flush()
