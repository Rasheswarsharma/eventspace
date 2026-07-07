import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from app.config.env import settings

# JWT Specifications
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str) -> str:
    """Hashes a raw password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    """Verifies a raw password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a secure, signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    payload = {
        "sub": str(user_id),
        "role": str(role),
        "exp": expire,
        "iat": now
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a signed JWT access token. Returns payload if valid."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None

def generate_refresh_token_string() -> str:
    """Generates a cryptographically secure, random 64-character hex string."""
    return secrets.token_hex(32)
