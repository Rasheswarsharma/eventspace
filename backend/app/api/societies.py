from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query  # pyrefly: ignore [missing-import]
from beanie import PydanticObjectId  # pyrefly: ignore [missing-import]
from app.models.user import User  # pyrefly: ignore [missing-import]
from app.models.society import Society  # pyrefly: ignore [missing-import]
from app.models.enums import UserRole  # pyrefly: ignore [missing-import]
from app.schemas.society import SocietyCreate, SocietyUpdate, SocietyResponse  # pyrefly: ignore [missing-import]
from app.core.dependencies import get_current_active_user, require_roles  # pyrefly: ignore [missing-import]

router = APIRouter()

@router.post("/create-society", response_model=SocietyResponse, status_code=status.HTTP_201_CREATED)
async def create_society_by_president(
    payload: SocietyCreate,
    current_user: User = Depends(require_roles([UserRole.SOCIETY_PRESIDENT, UserRole.SUPER_ADMIN]))
):
    """
    Creates a new society by a Society President/Organizer during onboarding.
    """
    from app.database.connection import DB_CONNECTED
    from datetime import datetime, timezone
    if not DB_CONNECTED:
        import uuid
        return {
            "id": PydanticObjectId(),
            "name": payload.name,
            "short_name": payload.short_name,
            "description": payload.description or f"Welcome to {payload.name}!",
            "logo_url": payload.logo_url,
            "theme_color": payload.theme_color or "#2563EB",
            "created_by_user_id": current_user.id,
            "referral_code": f"{payload.short_name.upper()}-{uuid.uuid4().hex[:6].upper()}",
            "is_archived": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

    if current_user.society_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already associated with a society"
        )
        
    existing = await Society.find_one(
        (Society.name == payload.name) | (Society.short_name == payload.short_name)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Society name or short name is already registered"
        )
        
    # Generate unique referral code
    import uuid
    ref_code = f"{payload.short_name.upper()}-{uuid.uuid4().hex[:6].upper()}"
    
    society = Society(
        name=payload.name,
        short_name=payload.short_name,
        description=payload.description or f"Welcome to {payload.name}!",
        logo_url=payload.logo_url,
        theme_color=payload.theme_color or "#2563EB",
        created_by_user_id=current_user.id,
        referral_code=ref_code
    )
    await society.insert()
    
    # Associate user with the new society
    current_user.society_id = society.id
    await current_user.save()
    
    return society

@router.get("/validate-referral", response_model=SocietyResponse)
async def validate_referral(code: str = Query(...)):
    """
    Checks if a referral code is valid and returns the associated society details.
    """
    from app.database.connection import DB_CONNECTED
    from datetime import datetime, timezone
    if not DB_CONNECTED:
        return {
            "id": PydanticObjectId("668a62bf784b23b18c065fde"),
            "name": "Mock Society",
            "short_name": "MOCK",
            "description": "Mocked Society workspace for local simulation.",
            "logo_url": None,
            "theme_color": "#2563EB",
            "created_by_user_id": PydanticObjectId("668a62bf784b23b18c065fde"),
            "referral_code": code,
            "is_archived": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

    society = await Society.find_one(Society.referral_code == code, Society.is_archived == False)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired referral code"
        )
    return society

@router.post("/", response_model=SocietyResponse, status_code=status.HTTP_201_CREATED)
async def create_society(
    payload: SocietyCreate,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
):
    """
    Registers a new college society. Restricted to Super Admins.
    """
    from app.database.connection import DB_CONNECTED
    from datetime import datetime, timezone
    if not DB_CONNECTED:
        return {
            "id": PydanticObjectId(),
            "name": payload.name,
            "short_name": payload.short_name,
            "description": payload.description,
            "logo_url": payload.logo_url,
            "theme_color": payload.theme_color,
            "created_by_user_id": current_user.id,
            "referral_code": f"{payload.short_name.upper()}-MOCK",
            "is_archived": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

    # Check if duplicate name or short name exists
    existing = await Society.find_one(
        (Society.name == payload.name) | (Society.short_name == payload.short_name)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Society name or short name is already registered"
        )
        
    society = Society(
        name=payload.name,
        short_name=payload.short_name,
        description=payload.description,
        logo_url=payload.logo_url,
        theme_color=payload.theme_color,
        created_by_user_id=current_user.id
    )
    await society.insert()
    return society

@router.get("/", response_model=List[SocietyResponse])
async def list_societies():
    """
    Retrieves all non-archived societies. Open to all users.
    """
    from app.database.connection import DB_CONNECTED
    from datetime import datetime, timezone
    if not DB_CONNECTED:
        return [
            {
                "id": PydanticObjectId("668a62bf784b23b18c065fde"),
                "name": "Computer Society of India",
                "short_name": "CSI",
                "description": "CSI Student Branch",
                "logo_url": None,
                "theme_color": "#2563EB",
                "created_by_user_id": PydanticObjectId("668a62bf784b23b18c065fde"),
                "referral_code": "CSI-1234",
                "is_archived": False,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ]

    return await Society.find(Society.is_archived == False).to_list()

@router.get("/{id}", response_model=SocietyResponse)
async def get_society(id: PydanticObjectId):
    """
    Retrieves details for a specific society.
    """
    from app.database.connection import DB_CONNECTED
    from datetime import datetime, timezone
    if not DB_CONNECTED:
        return {
            "id": id,
            "name": "Computer Society of India",
            "short_name": "CSI",
            "description": "CSI Student Branch",
            "logo_url": None,
            "theme_color": "#2563EB",
            "created_by_user_id": PydanticObjectId("668a62bf784b23b18c065fde"),
            "referral_code": "CSI-1234",
            "is_archived": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

    society = await Society.find_one(Society.id == id, Society.is_archived == False)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found or archived"
        )
    return society

@router.put("/{id}", response_model=SocietyResponse)
async def update_society(
    id: PydanticObjectId,
    payload: SocietyUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates society configurations. Allowed for Super Admins, or the Society President of this tenant.
    """
    from app.database.connection import DB_CONNECTED
    from datetime import datetime, timezone
    if not DB_CONNECTED:
        return {
            "id": id,
            "name": payload.name or "Computer Society of India",
            "short_name": payload.short_name or "CSI",
            "description": payload.description or "CSI Student Branch",
            "logo_url": payload.logo_url,
            "theme_color": payload.theme_color or "#2563EB",
            "created_by_user_id": current_user.id,
            "referral_code": "CSI-1234",
            "is_archived": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

    society = await Society.find_one(Society.id == id, Society.is_archived == False)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )
        
    # Permission verification
    is_president = current_user.role == UserRole.SOCIETY_PRESIDENT and current_user.society_id == id
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    if not (is_admin or is_president):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this society"
        )
        
    update_dict = payload.model_dump(exclude_unset=True)
    if not update_dict:
        return society
        
    for k, v in update_dict.items():
        setattr(society, k, v)
        
    society.updated_at = datetime.now(timezone.utc)
    await society.save()
    return society

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_society(
    id: PydanticObjectId,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
):
    """
    Soft deletes/archives a college society. Restricted to Super Admins.
    """
    from app.database.connection import DB_CONNECTED
    if not DB_CONNECTED:
        return {"message": "Society successfully archived"}

    society = await Society.get(id)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )
    society.is_archived = True
    await society.save()
    return {"message": "Society successfully archived"}
