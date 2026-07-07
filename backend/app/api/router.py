from fastapi import APIRouter  # pyrefly: ignore [missing-import]
from app.api.auth import router as auth_router  # pyrefly: ignore [missing-import]
from app.api.societies import router as societies_router  # pyrefly: ignore [missing-import]
from app.api.events import router as events_router  # pyrefly: ignore [missing-import]
from app.api.registrations import router as registrations_router  # pyrefly: ignore [missing-import]
from app.api.volunteers import router as volunteers_router  # pyrefly: ignore [missing-import]
from app.api.judges import router as judges_router  # pyrefly: ignore [missing-import]
from app.api.attendance import router as attendance_router  # pyrefly: ignore [missing-import]
from app.api.certificates import router as certificates_router  # pyrefly: ignore [missing-import]
from app.api.budgets import router as budgets_router  # pyrefly: ignore [missing-import]
from app.api.chats import router as chats_router  # pyrefly: ignore [missing-import]
from app.api.notifications import router as notifications_router  # pyrefly: ignore [missing-import]
from app.api.faculty import router as faculty_router  # pyrefly: ignore [missing-import]
from app.api.invitations import router as invitations_router  # pyrefly: ignore [missing-import]

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(societies_router, prefix="/societies", tags=["Societies"])
api_router.include_router(events_router, prefix="/events", tags=["Events"])
api_router.include_router(registrations_router, prefix="", tags=["Registrations"])
api_router.include_router(volunteers_router, prefix="", tags=["Volunteers & Tasks"])
api_router.include_router(judges_router, prefix="", tags=["Judges & Scoring"])
api_router.include_router(attendance_router, prefix="", tags=["Attendance"])
api_router.include_router(certificates_router, prefix="", tags=["Certificates"])
api_router.include_router(budgets_router, prefix="", tags=["Budgets"])
api_router.include_router(chats_router, prefix="/chats", tags=["Chats"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(faculty_router, prefix="/faculty", tags=["Faculty Advisor"])
api_router.include_router(invitations_router, prefix="/invitations", tags=["Invitations"])
