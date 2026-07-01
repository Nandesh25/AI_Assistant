"""File upload + download endpoints."""
from fastapi import APIRouter, UploadFile, status
from fastapi.responses import FileResponse

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.schemas.message import FileOut
from app.services.file_service import FileService

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=FileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile, current_user: CurrentUser, db: DbSession
) -> FileOut:
    record = await FileService(db).save(file, current_user.id)
    return FileOut.model_validate(record)


@router.get("/{storage_path}")
def download_file(storage_path: str, current_user: CurrentUser) -> FileResponse:
    from pathlib import Path

    # Guard against path traversal: only the bare filename is permitted.
    safe_name = Path(storage_path).name
    full_path = Path(settings.UPLOAD_DIR) / safe_name
    if not full_path.is_file():
        raise NotFoundError("File not found")
    return FileResponse(full_path)
