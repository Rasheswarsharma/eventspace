from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field, EmailStr, ConfigDict
from pymongo import IndexModel, ASCENDING
from app.models.enums import UserRole

def utc_now() -> datetime:
    """Returns the current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)

class User(Document):
    """
    User model representing EventSphere users across all roles and society affiliations.
    
    TIPS FOR FUTURE LAYERS:
    - Maintaining `updated_at`: In the database interaction layer, we will hook into
      Beanie's event lifecycles. By defining a method decorated with:
      `@before_event([Insert, Replace, SaveChanges, Update])`, we will programmatically
      update the timestamp: `self.updated_at = datetime.now(timezone.utc)` before persisting.
    """
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password_hash: str
    role: UserRole = Field(default=UserRole.STUDENT)
    
    # Nullable fields
    society_id: Optional[PydanticObjectId] = None
    profile_image_url: Optional[str] = None
    phone: Optional[str] = Field(default=None, min_length=10, max_length=15)
    college: Optional[str] = Field(default=None, max_length=150)
    invited_by: Optional[PydanticObjectId] = None
    referral_code_used: Optional[str] = Field(default=None, max_length=50)
    
    # Flags and timestamps (Timezone-aware UTC)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    
    # Password reset and email verification tokens
    reset_token_hash: Optional[str] = None
    reset_token_expires_at: Optional[datetime] = None
    verification_token_hash: Optional[str] = None
    verification_token_expires_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    last_login: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )

    class Settings:
        name = "users"
        use_state_holder = True  # Allows change tracking in Beanie
        
        # Centralized index definitions for optimized lookup queries
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("role", ASCENDING)]),
            IndexModel([("society_id", ASCENDING)]),
            IndexModel([("is_active", ASCENDING)]),
        ]
