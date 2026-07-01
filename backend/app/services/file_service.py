"""Secure file upload handling.

Security measures:
- Whitelist of allowed content types (images, PDF, DOCX, ZIP).
- Size limit enforced from settings.
- Randomized stored filename (prevents path traversal & collisions); the
  original name is retained only as metadata.
"""
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ValidationError
from app.models.file import File
from app.repositories.file_repository import FileRepository

ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
}


class FileService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = FileRepository(db)
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, upload: UploadFile, uploader_id: int) -> File:
        if upload.content_type not in ALLOWED_CONTENT_TYPES:
            raise ValidationError(f"Unsupported file type: {upload.content_type}")

        contents = await upload.read()
        if len(contents) > settings.max_upload_bytes:
            raise ValidationError(
                f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit"
            )

        ext = ALLOWED_CONTENT_TYPES[upload.content_type]
        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = self.upload_dir / stored_name
        dest.write_bytes(contents)

        record = File(
            uploader_id=uploader_id,
            filename=upload.filename or stored_name,
            content_type=upload.content_type,
            size_bytes=len(contents),
            storage_path=str(stored_name),
        )
        self.repo.add(record)
        self.db.commit()
        return record
