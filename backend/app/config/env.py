from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "EventSphere"
    SECRET_KEY: str = "your_cryptographic_secret_key_string"
    DATABASE_URL: str = "mongodb://localhost:27017/eventsphere"
    CORS_ORIGINS: List[str] = ["*"]

    # Allow loading from a .env file if it exists
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
