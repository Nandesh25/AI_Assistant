"""Application configuration loaded from environment variables.

Follows the 12-Factor App principle: configuration lives in the environment,
never hard-coded. Pydantic validates and types every setting at startup so the
app fails fast on misconfiguration.
"""
from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )

    # Application
    PROJECT_NAME: str = "Enterprise Chat API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    # Optional full SQLAlchemy URL; when set it overrides the Postgres parts
    # (used by the test suite to point at SQLite).
    SQLALCHEMY_DATABASE_URI: str | None = None

    # CORS — NoDecode keeps pydantic-settings from JSON-parsing the env value;
    # the validator below splits the comma-separated string instead.
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = []

    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # AI assistant (Ollama — free, local LLM)
    OLLAMA_ENABLED: bool = True
    OLLAMA_BASE_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "llama3.2:1b"
    OLLAMA_TIMEOUT_SECONDS: int = 120
    OLLAMA_SYSTEM_PROMPT: str = (
        "You are a helpful, concise assistant inside an enterprise chat application."
    )

    # AI bot contact: a seeded user that auto-replies in direct chats.
    AI_BOT_USERNAME: str = "ai-assistant"
    AI_BOT_EMAIL: str = "ai-assistant@local.bot"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def DATABASE_URL(self) -> str:
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — read env once per process."""
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
