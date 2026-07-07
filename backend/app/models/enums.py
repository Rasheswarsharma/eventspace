from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    FACULTY = "faculty"
    SOCIETY_PRESIDENT = "society_president"
    SOCIETY_ADMIN = "society_admin"
    EVENT_HOST = "event_host"
    JUDGE = "judge"
    VOLUNTEER = "volunteer"
    STUDENT = "student"

class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_CLOSED = "registration_closed"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class CheckInStatus(str, Enum):
    ABSENT = "absent"
    PRESENT = "present"
    LATE = "late"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

