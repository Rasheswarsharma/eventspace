from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field, ConfigDict
from pymongo import IndexModel, ASCENDING

class RefreshToken(Document):
    """
    Refresh token model to persist and validate user sessions.
    """
    user_id: PydanticObjectId
    token_hash: str
    expires_at: datetime
    revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    class Settings:
        name = "refresh_tokens"
        use_state_holder = True
        
        # Index configurations
        indexes = [
            IndexModel([("token_hash", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
            # TTL Index: auto-deletes expired token documents
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
        ]
