"""File metadata data access."""
from app.models.file import File
from app.repositories.base import BaseRepository


class FileRepository(BaseRepository[File]):
    model = File
