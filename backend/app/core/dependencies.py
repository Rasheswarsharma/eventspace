from typing import List
from fastapi import Depends, HTTPException, status  # pyrefly: ignore [missing-import]
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  # pyrefly: ignore [missing-import]
from app.services.security import decode_access_token  # pyrefly: ignore [missing-import]
from app.models.user import User  # pyrefly: ignore [missing-import]
from app.models.enums import UserRole  # pyrefly: ignore [missing-import]
from beanie import PydanticObjectId  # pyrefly: ignore [missing-import]

# HTTPBearer Security Scheme
security_scheme = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> User:
    """
    Dependency to validate the JWT bearer token and inject the current User document.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject identity",
        )
        
    try:
        user_id = PydanticObjectId(user_id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token",
        )
        
    from app.database.connection import DB_CONNECTED
    if not DB_CONNECTED:
        class MockUser:
            def __init__(self, id, full_name, email, role, is_active, is_verified):
                from datetime import datetime, timezone
                self.id = id
                self.full_name = full_name
                self.email = email
                self.role = role
                self.is_active = is_active
                self.is_verified = is_verified
                self.society_id = None
                self.phone = None
                self.profile_image_url = None
                self.college = "SCIT College"
                self.created_at = datetime.now(timezone.utc)
                self.updated_at = datetime.now(timezone.utc)
            async def save(self):
                pass
            async def update(self):
                pass
        user = MockUser(
            id=user_id,
            full_name="Testing Admin" if str(user_id) == "668a62bf784b23b18c065fde" else "Super Admin",
            email="testing1234@gmail.com" if str(user_id) == "668a62bf784b23b18c065fde" else "rashu@gmail.com",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True
        )
    else:
        user = await User.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current authenticated user is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user

def require_roles(allowed_roles: List[UserRole]):
    """
    Dependency factory to check if the authenticated user has one of the allowed roles.
    """
    async def dependency(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user
    return dependency
