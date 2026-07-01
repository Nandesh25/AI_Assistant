"""Group chat endpoints."""
from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.chat import ChatOut, GroupCreate, GroupUpdate, MemberAdd
from app.schemas.common import MessageResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
def create_group(data: GroupCreate, current_user: CurrentUser, db: DbSession) -> ChatOut:
    return ChatOut.model_validate(ChatService(db).create_group(current_user.id, data))


@router.put("/{group_id}", response_model=ChatOut)
def update_group(
    group_id: int, data: GroupUpdate, current_user: CurrentUser, db: DbSession
) -> ChatOut:
    return ChatOut.model_validate(
        ChatService(db).update_group(group_id, current_user.id, data)
    )


@router.delete("/{group_id}", response_model=MessageResponse)
def delete_group(group_id: int, current_user: CurrentUser, db: DbSession) -> MessageResponse:
    ChatService(db).delete_group(group_id, current_user.id)
    return MessageResponse(detail="Group deleted")


@router.post("/{group_id}/members", response_model=ChatOut)
def add_member(
    group_id: int, data: MemberAdd, current_user: CurrentUser, db: DbSession
) -> ChatOut:
    return ChatOut.model_validate(
        ChatService(db).add_member(group_id, current_user.id, data.user_id)
    )


@router.delete("/{group_id}/members/{user_id}", response_model=ChatOut)
def remove_member(
    group_id: int, user_id: int, current_user: CurrentUser, db: DbSession
) -> ChatOut:
    return ChatOut.model_validate(
        ChatService(db).remove_member(group_id, current_user.id, user_id)
    )
