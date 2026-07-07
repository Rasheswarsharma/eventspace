from typing import Optional, List, Union
from beanie import PydanticObjectId
from app.models.user import User

class UserRepository:
    """
    Repository layer for User database operations using Beanie ODM.
    """

    @staticmethod
    async def create_user(user: User) -> User:
        """
        Inserts a new user document into the database.
        """
        await user.insert()
        return user

    @staticmethod
    async def get_by_id(user_id: Union[PydanticObjectId, str]) -> Optional[User]:
        """
        Retrieves a user by their object ID.
        """
        if isinstance(user_id, str):
            try:
                user_id = PydanticObjectId(user_id)
            except Exception:
                return None
        return await User.get(user_id)

    @staticmethod
    async def get_by_email(email: str) -> Optional[User]:
        """
        Retrieves a user by their email address.
        """
        return await User.find_one(User.email == email)

    @staticmethod
    async def get_all() -> List[User]:
        """
        Retrieves all user documents from the database.
        """
        return await User.find_all().to_list()

    @staticmethod
    async def update_user(user: User) -> User:
        """
        Saves updates to an existing user document.
        """
        await user.save()
        return user

    @staticmethod
    async def delete_user(user: User) -> User:
        """
        Logically deletes a user by setting is_active to False.
        """
        user.is_active = False
        await user.save()
        return user

    @staticmethod
    async def exists_by_email(email: str) -> bool:
        """
        Checks if a user exists with the given email address.
        """
        count = await User.find(User.email == email).count()
        return count > 0

    @staticmethod
    async def exists_by_id(user_id: Union[PydanticObjectId, str]) -> bool:
        """
        Checks if a user exists with the given object ID.
        """
        if isinstance(user_id, str):
            try:
                user_id = PydanticObjectId(user_id)
            except Exception:
                return False
        count = await User.find(User.id == user_id).count()
        return count > 0
