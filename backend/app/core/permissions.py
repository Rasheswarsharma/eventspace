from enum import Enum
from typing import Dict, List
from app.models.enums import UserRole

class Permission(str, Enum):
    # Event permissions
    EVENT_CREATE = "event:create"
    EVENT_READ = "event:read"
    EVENT_UPDATE = "event:update"
    EVENT_DELETE = "event:delete"

    # Registration permissions
    REGISTRATION_CREATE = "registration:create"
    REGISTRATION_READ = "registration:read"
    REGISTRATION_UPDATE = "registration:update"
    REGISTRATION_DELETE = "registration:delete"

    # Volunteer permissions
    VOLUNTEER_MANAGE = "volunteer:manage"
    VOLUNTEER_VIEW = "volunteer:view"

    # Budget permissions
    BUDGET_MANAGE = "budget:manage"
    BUDGET_VIEW = "budget:view"

    # Score permissions
    SCORE_SUBMIT = "score:submit"
    SCORE_VIEW = "score:view"

    # Certificate permissions
    CERTIFICATE_GENERATE = "certificate:generate"
    CERTIFICATE_VIEW = "certificate:view"

    # Chat permissions
    CHAT_WRITE = "chat:write"
    CHAT_READ = "chat:read"

    # Admin permissions
    MANAGE_SOCIETY = "society:manage"
    MANAGE_USERS = "users:manage"

# Explicit role to permission mapping
ROLE_PERMISSIONS: Dict[UserRole, List[str]] = {
    UserRole.SUPER_ADMIN: [p.value for p in Permission],
    
    UserRole.ORGANIZATION_ADMIN: [
        Permission.EVENT_CREATE, Permission.EVENT_READ, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.REGISTRATION_CREATE, Permission.REGISTRATION_READ, Permission.REGISTRATION_UPDATE, Permission.REGISTRATION_DELETE,
        Permission.VOLUNTEER_MANAGE, Permission.VOLUNTEER_VIEW,
        Permission.BUDGET_MANAGE, Permission.BUDGET_VIEW,
        Permission.CERTIFICATE_GENERATE, Permission.CERTIFICATE_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ,
        Permission.MANAGE_SOCIETY
    ],
    
    UserRole.SOCIETY_PRESIDENT: [
        Permission.EVENT_CREATE, Permission.EVENT_READ, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.REGISTRATION_CREATE, Permission.REGISTRATION_READ, Permission.REGISTRATION_UPDATE, Permission.REGISTRATION_DELETE,
        Permission.VOLUNTEER_MANAGE, Permission.VOLUNTEER_VIEW,
        Permission.BUDGET_MANAGE, Permission.BUDGET_VIEW,
        Permission.CERTIFICATE_GENERATE, Permission.CERTIFICATE_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ,
        Permission.MANAGE_SOCIETY
    ],

    UserRole.SOCIETY_ADMIN: [
        Permission.EVENT_CREATE, Permission.EVENT_READ, Permission.EVENT_UPDATE, Permission.EVENT_DELETE,
        Permission.REGISTRATION_CREATE, Permission.REGISTRATION_READ, Permission.REGISTRATION_UPDATE, Permission.REGISTRATION_DELETE,
        Permission.VOLUNTEER_MANAGE, Permission.VOLUNTEER_VIEW,
        Permission.BUDGET_MANAGE, Permission.BUDGET_VIEW,
        Permission.CERTIFICATE_GENERATE, Permission.CERTIFICATE_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],

    UserRole.FACULTY: [
        Permission.EVENT_READ,
        Permission.REGISTRATION_READ,
        Permission.BUDGET_VIEW,
        Permission.SCORE_VIEW,
        Permission.CERTIFICATE_VIEW,
        Permission.CHAT_READ
    ],

    UserRole.COORDINATOR: [
        Permission.EVENT_READ, Permission.EVENT_UPDATE,
        Permission.REGISTRATION_READ, Permission.REGISTRATION_UPDATE,
        Permission.VOLUNTEER_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],

    UserRole.VOLUNTEER_LEAD: [
        Permission.EVENT_READ,
        Permission.VOLUNTEER_MANAGE, Permission.VOLUNTEER_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],

    UserRole.VOLUNTEER: [
        Permission.EVENT_READ,
        Permission.VOLUNTEER_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],

    UserRole.JUDGE: [
        Permission.EVENT_READ,
        Permission.SCORE_SUBMIT, Permission.SCORE_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],

    UserRole.MENTOR: [
        Permission.EVENT_READ,
        Permission.SCORE_VIEW,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],

    UserRole.STUDENT: [
        Permission.EVENT_READ,
        Permission.REGISTRATION_CREATE, Permission.REGISTRATION_READ,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],

    UserRole.PARTICIPANT: [
        Permission.EVENT_READ,
        Permission.REGISTRATION_CREATE, Permission.REGISTRATION_READ,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ],
    
    UserRole.EVENT_HOST: [
        Permission.EVENT_READ, Permission.EVENT_UPDATE,
        Permission.REGISTRATION_READ,
        Permission.CHAT_WRITE, Permission.CHAT_READ
    ]
}
