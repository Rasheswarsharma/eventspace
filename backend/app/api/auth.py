import hashlib
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status  # pyrefly: ignore [missing-import]
from app.models.user import User  # pyrefly: ignore [missing-import]
from app.models.refresh_token import RefreshToken  # pyrefly: ignore [missing-import]
from beanie import PydanticObjectId  # pyrefly: ignore [missing-import]
from app.schemas.user import (  # pyrefly: ignore [missing-import]
    UserCreate,
    UserLogin,
    UserResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    RoleUpdate,
)
from app.services.security import (  # pyrefly: ignore [missing-import]
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token_string,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.core.dependencies import get_current_active_user, require_roles  # pyrefly: ignore [missing-import]
from app.models.enums import UserRole  # pyrefly: ignore [missing-import]

logger = logging.getLogger("eventsphere.auth")
router = APIRouter()

# Global in-memory dictionary to store registered mock users when database is disconnected
MOCK_USERS_DB = {}

def hash_token(token: str) -> str:
    """Utility to hash a token using SHA-256 before database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, request: Request):
    """
    Registers a new student/organizer user account.
    """
    from app.database.connection import DB_CONNECTED
    if not DB_CONNECTED:
        verification_token = generate_refresh_token_string()
        mock_user = {
            "id": PydanticObjectId(),
            "full_name": payload.full_name,
            "email": payload.email,
            "role": payload.role or UserRole.STUDENT,
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        # Save to global in-memory DB for authentication
        MOCK_USERS_DB[payload.email] = {
            "user": mock_user,
            "password_hash": hash_password(payload.password)
        }
        logger.info(f"Registered MOCK user to in-memory database: {payload.email}")
        return mock_user

    # Check if email is already registered
    existing_user = await User.find_one(User.email == payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Generate verification token
    verification_token = generate_refresh_token_string()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    # Process referral code
    society_id = payload.society_id
    referral_code_used = None
    if payload.referral_code:
        from app.models.society import Society
        soc = await Society.find_one(Society.referral_code == payload.referral_code)
        if not soc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid referral code"
            )
        society_id = soc.id
        referral_code_used = payload.referral_code

    # Process invitation token
    role = payload.role or UserRole.STUDENT
    invited_by = None
    if payload.invite_token:
        from app.models.invitation import Invitation
        from app.models.enums import InvitationStatus
        invite = await Invitation.find_one(
            Invitation.token == payload.invite_token,
            Invitation.status == InvitationStatus.PENDING,
            Invitation.expires_at > datetime.now(timezone.utc)
        )
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation link is invalid or expired"
            )
        if payload.email != invite.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation token was issued for a different email address"
            )
        role = invite.role
        society_id = invite.society_id
        invited_by = invite.invited_by_user_id

    # Create the user document
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        society_id=society_id,
        college=payload.college,
        role=role,
        invited_by=invited_by,
        referral_code_used=referral_code_used,
        is_active=True,
        is_verified=True,
        verification_token_hash=hash_token(verification_token),
        verification_token_expires_at=expires_at
    )
    await user.insert()

    # Mark invitation as accepted
    if payload.invite_token:
        from app.models.invitation import Invitation
        from app.models.enums import InvitationStatus
        invite = await Invitation.find_one(Invitation.token == payload.invite_token)
        if invite:
            invite.status = InvitationStatus.ACCEPTED
            invite.updated_at = datetime.now(timezone.utc)
            await invite.save()

    # Log registration activity
    from app.utils.audit import log_activity
    await log_activity(
        actor_id=user.id if 'user' in locals() and hasattr(user, 'id') else None,
        action="user_registration",
        target_model="users",
        target_id=user.id if 'user' in locals() and hasattr(user, 'id') else None,
        changes_payload={"email": payload.email},
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )

    logger.info(f"Registered user: {user.email} (ID: {user.id})")
    logger.info(f"MOCK EMAIL: Registration verification link for {user.email}: http://localhost:3000/verify-email?token={verification_token}")
    return user

@router.post("/login")
async def login(payload: UserLogin, response: Response, request: Request):
    """
    Authenticates user, creates session, and returns access token.
    """
    from app.database.connection import DB_CONNECTED
    
    if not DB_CONNECTED:
        # Check against in-memory mock database first
        if payload.email in MOCK_USERS_DB:
            mock_data = MOCK_USERS_DB[payload.email]
            if verify_password(payload.password, mock_data["password_hash"]):
                access_token = create_access_token(user_id=str(mock_data["user"]["id"]), role=mock_data["user"]["role"].value if hasattr(mock_data["user"]["role"], "value") else str(mock_data["user"]["role"]))
                response.set_cookie(
                    key="refresh_token",
                    value=generate_refresh_token_string(),
                    httponly=True,
                    secure=True,
                    samesite="strict",
                    max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
                )
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": mock_data["user"]
                }

        if payload.email == "testing1234@gmail.com" and payload.password == "12345678":
            mock_id = "668a62bf784b23b18c065fde"
            access_token = create_access_token(user_id=mock_id, role=UserRole.SUPER_ADMIN.value)
            mock_user = {
                "id": mock_id,
                "full_name": "Testing Admin",
                "email": "testing1234@gmail.com",
                "role": UserRole.SUPER_ADMIN.value,
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            response.set_cookie(
                key="refresh_token",
                value=generate_refresh_token_string(),
                httponly=True,
                secure=True,
                samesite="strict",
                max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": mock_user
            }
        elif payload.email == "rashu@gmail.com" and payload.password == "admin@1234":
            mock_id = "668a62bf784b23b18c065fdf"
            access_token = create_access_token(user_id=mock_id, role=UserRole.SUPER_ADMIN.value)
            mock_user = {
                "id": mock_id,
                "full_name": "Super Admin",
                "email": "rashu@gmail.com",
                "role": UserRole.SUPER_ADMIN.value,
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            response.set_cookie(
                key="refresh_token",
                value=generate_refresh_token_string(),
                httponly=True,
                secure=True,
                samesite="strict",
                max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": mock_user
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password in Mock Mode",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = await User.find_one(User.email == payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
        
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await user.save()
    
    # Generate tokens
    access_token = create_access_token(user_id=str(user.id), role=user.role.value)
    refresh_token = generate_refresh_token_string()
    
    # Save Refresh Token hashed to DB
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=expires_at
    )
    await db_refresh_token.insert()
    
    # Set HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    )
    
    # Log login activity
    from app.utils.audit import log_activity
    await log_activity(
        actor_id=user.id,
        action="user_login",
        target_model="users",
        target_id=user.id,
        changes_payload={"email": user.email},
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/refresh")
async def refresh(request: Request, response: Response):
    """
    Refreshes the expired access token using the HttpOnly refresh token cookie.
    """
    from app.database.connection import DB_CONNECTED
    
    if not DB_CONNECTED:
        new_access_token = create_access_token(user_id="668a62bf784b23b18c065fde", role=UserRole.SUPER_ADMIN.value)
        new_refresh_token = generate_refresh_token_string()
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
        )
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired, please log in again"
        )
        
    token_hash = hash_token(refresh_token)
    db_token = await RefreshToken.find_one(RefreshToken.token_hash == token_hash)
    
    if not db_token or db_token.revoked or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
        
    user = await User.get(db_token.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or suspended"
        )
        
    # Rotate refresh tokens
    await db_token.delete()
    
    new_access_token = create_access_token(user_id=str(user.id), role=user.role.value)
    new_refresh_token = generate_refresh_token_string()
    
    # Save new Refresh Token
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_refresh_token),
        expires_at=expires_at
    )
    await new_db_token.insert()
    
    # Update cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logs out the user and revokes the active session.
    """
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        token_hash = hash_token(refresh_token)
        db_token = await RefreshToken.find_one(RefreshToken.token_hash == token_hash)
        if db_token:
            await db_token.delete()
            
    response.delete_cookie("refresh_token")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Returns profile information for the currently authenticated user.
    """
    return current_user

@router.post("/verify-email")
async def verify_email(token: str):
    """Verifies institutional email using the verification token."""
    token_hash = hash_token(token)
    user = await User.find_one(
        User.verification_token_hash == token_hash,
        User.verification_token_expires_at > datetime.now(timezone.utc)
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    user.is_verified = True
    user.is_active = True
    user.verification_token_hash = None
    user.verification_token_expires_at = None
    await user.save()
    logger.info(f"Verified email and activated account for: {user.email}")
    return {"message": "Email verified successfully"}

@router.post("/forgot-password")
async def forgot_password(payload: PasswordResetRequest):
    """Requests a password recovery reset token."""
    user = await User.find_one(User.email == payload.email)
    if not user:
        # Return 200 to prevent user enumeration attacks
        logger.info(f"Forgot password request for unregistered email: {payload.email}")
        return {"message": "If the email is registered, a password recovery link has been sent."}
    
    reset_token = generate_refresh_token_string()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    user.reset_token_hash = hash_token(reset_token)
    user.reset_token_expires_at = expires_at
    await user.save()
    
    logger.info(f"MOCK EMAIL: Password reset link for {user.email}: http://localhost:3000/reset-password?token={reset_token}")
    return {"message": "If the email is registered, a password recovery link has been sent."}

@router.post("/reset-password")
async def reset_password(payload: PasswordResetConfirm):
    """Resets the password using a valid recovery token."""
    token_hash = hash_token(payload.token)
    user = await User.find_one(
        User.reset_token_hash == token_hash,
        User.reset_token_expires_at > datetime.now(timezone.utc)
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user.password_hash = hash_password(payload.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    await user.save()
    
    logger.info(f"Password reset successfully completed for user: {user.email}")
    return {"message": "Password updated successfully"}

@router.put("/role")
async def update_role(
    payload: RoleUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
):
    """Updates user privileges (role). Super Admin only."""
    target_user = await User.get(payload.user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_role = target_user.role
    target_user.role = payload.role
    await target_user.save()
    
    logger.info(f"Super Admin {current_user.email} updated role of user {target_user.email} from {old_role} to {payload.role}")
    
    # Log role change activity
    from app.utils.audit import log_activity
    await log_activity(
        actor_id=current_user.id,
        action="role_change",
        target_model="users",
        target_id=target_user.id,
        changes_payload={"email": target_user.email, "old_role": old_role, "new_role": payload.role},
        ip_address=request.client.host if request.client and request.client.host else None,
        user_agent=request.headers.get("user-agent")
    )

    return {"message": "User role updated successfully", "user_id": str(target_user.id), "new_role": target_user.role}
