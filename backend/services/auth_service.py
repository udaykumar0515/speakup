import uuid
from typing import Optional, Dict
from datetime import datetime

# In-memory storage
USERS: Dict[int, dict] = {}
USER_ID_COUNTER = {"current": 1}

def signup(email: str, name: str, password: str = "mock") -> dict:
    """Create a new user (mock implementation)"""
    user_id = USER_ID_COUNTER["current"]
    USER_ID_COUNTER["current"] += 1
    
    # Check if email already exists
    for user in USERS.values():
        if user["email"] == email:
            return None
    
    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "createdAt": datetime.now().isoformat(),
        "age": None,
        "gender": None,
        "occupation": None,
        "avatarUrl": None
    }
    USERS[user_id] = user
    return user

def login(email: str, password: str = "mock") -> Optional[dict]:
    """Login user (mock implementation - always succeeds if user exists)"""
    for user in USERS.values():
        if user["email"] == email:
            return user
    return None

def get_user(user_id: int) -> Optional[dict]:
    """Get user by ID"""
    return USERS.get(user_id)

def update_user(user_id: int, updates: dict) -> Optional[dict]:
    """Update user profile"""
    user = USERS.get(user_id)
    if not user:
        return None
    
    # Update allowed fields
    allowed_fields = ["name", "age", "gender", "occupation", "avatarUrl"]
    for field in allowed_fields:
        if field in updates and updates[field] is not None:
            user[field] = updates[field]
    
    return user
