import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.env import settings
from app.models import User, RefreshToken
from app.services.security import hash_password
from app.models.enums import UserRole

logger = logging.getLogger("eventsphere.database")

# Global flag to track database connection status for mock fallback
DB_CONNECTED = False

async def init_db():
    """
    Initializes connection to MongoDB Atlas database and registers Beanie models.
    """
    global DB_CONNECTED
    logger.info("Initializing database connection...")
    try:
        # Create Motor Client
        client = AsyncIOMotorClient(settings.DATABASE_URL)
        
        # Patch client to prevent Beanie/Motor compatibility initialization error
        client.append_metadata = lambda *args, **kwargs: None
        
        # Parse database name from connection string
        db_name = settings.DATABASE_URL.split("/")[-1]
        if "?" in db_name:
            db_name = db_name.split("?")[0]
        if not db_name:
            db_name = "eventsphere"
            
        # Initialize Beanie with document models
        from app.models import (
            User, RefreshToken, Society, Event, Registration, Team,
            ProjectSubmission, Attendance, VolunteerTask, Score,
            Certificate, Notification, Gallery, Budget, Feedback,
            AuditLog, Invitation, VolunteerRequest, ChatMessage
        )
        await init_beanie(
            database=client[db_name],
            document_models=[
                User, RefreshToken, Society, Event, Registration, Team,
                ProjectSubmission, Attendance, VolunteerTask, Score,
                Certificate, Notification, Gallery, Budget, Feedback,
                AuditLog, Invitation, VolunteerRequest, ChatMessage
            ]
        )
        DB_CONNECTED = True
        logger.info(f"Database successfully connected. Target database: {db_name}")

        # Seed default Super Admin user if not exists
        admin_email = "rashu@gmail.com"
        admin_user = await User.find_one(User.email == admin_email)
        if not admin_user:
            logger.info(f"Seeding default Super Admin user: {admin_email}")
            admin_user = User(
                full_name="Super Admin",
                email=admin_email,
                password_hash=hash_password("admin@1234"),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            await admin_user.insert()
            logger.info("Default Super Admin user seeded successfully.")

        # Seed testing admin user
        testing_email = "testing1234@gmail.com"
        testing_user = await User.find_one(User.email == testing_email)
        if not testing_user:
            logger.info(f"Seeding default testing admin user: {testing_email}")
            testing_user = User(
                full_name="Testing Admin",
                email=testing_email,
                password_hash=hash_password("12345678"),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            await testing_user.insert()
            logger.info("Default testing admin user seeded successfully.")
            
    except Exception as e:
        DB_CONNECTED = False
        logger.warning(f"Failed to initialize database connection: {e}. Entering Mock database fallback mode.")
