"""Authentication endpoints."""
from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: DbSession) -> AuthResponse:
    user, tokens = AuthService(db).register(data)
    return AuthResponse(user=UserOut.model_validate(user), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: DbSession) -> AuthResponse:
    user, tokens = AuthService(db).login(data)
    return AuthResponse(user=UserOut.model_validate(user), tokens=tokens)


@router.post("/refresh", response_model=TokenPair)
def refresh(data: RefreshRequest, db: DbSession) -> TokenPair:
    return AuthService(db).refresh(data.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: CurrentUser, db: DbSession) -> MessageResponse:
    AuthService(db).logout(current_user.id)
    return MessageResponse(detail="Logged out successfully")


@router.get("/me", response_model=UserOut)
def me(current_user: CurrentUser) -> UserOut:
    return UserOut.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    data: ChangePasswordRequest, current_user: CurrentUser, db: DbSession
) -> MessageResponse:
    AuthService(db).change_password(current_user, data.current_password, data.new_password)
    return MessageResponse(detail="Password changed. Please log in again.")
