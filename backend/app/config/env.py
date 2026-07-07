from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Any
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "EventSphere"
    SECRET_KEY: str = "your_cryptographic_secret_key_string"
    DATABASE_URL: str = "mongodb://localhost:27017/eventsphere"
    CORS_ORIGINS: Any = "*"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Allow loading from a .env file if it exists
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
