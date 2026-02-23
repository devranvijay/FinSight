"""
FinSight AI — Authentication & Authorization
JWT-based auth with RBAC, password validation, and token refresh.
"""
import os
import re
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt as _bcrypt
from dotenv import load_dotenv

from database import DB
from audit.logger import log_action
from constants import ROLE_PERMISSIONS, PASSWORD_MIN_LENGTH, PASSWORD_SPECIAL_CHARS

load_dotenv()
logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

# Warn on weak secret key
if len(SECRET_KEY) < 32:
    logger.warning("SECRET_KEY is shorter than 32 characters — please set a strong key in .env")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Password Utilities ─────────────────────────────────────────────────────────
def validate_password_strength(password: str) -> None:
    """
    Enforce password policy:
      - Min 8 characters
      - At least one uppercase letter
      - At least one digit
      - At least one special character
    Raises ValueError with a human-readable message if any rule fails.
    """
    errors = []
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"at least {PASSWORD_MIN_LENGTH} characters")
    if not re.search(r"[A-Z]", password):
        errors.append("one uppercase letter")
    if not re.search(r"\d", password):
        errors.append("one digit (0-9)")
    if not re.search(rf"[{re.escape(PASSWORD_SPECIAL_CHARS)}]", password):
        errors.append(f"one special character ({PASSWORD_SPECIAL_CHARS})")
    if errors:
        raise ValueError("Password must contain: " + ", ".join(errors))


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


# ── Token Utilities ────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    """Decode and validate a refresh token. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


# ── User Authentication ────────────────────────────────────────────────────────
def authenticate_user(email: str, password: str):
    user = DB.fetch_one(
        "SELECT * FROM users WHERE email = ? AND is_active = 1",
        (email.lower().strip(),)
    )
    if not user or not verify_password(password, user["password_hash"]):
        return None
    return user


# ── FastAPI Dependencies ───────────────────────────────────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = DB.fetch_one("SELECT * FROM users WHERE id = ? AND is_active = 1", (user_id,))
    if user is None:
        raise credentials_exception
    return user


def require_permission(permission: str):
    """Dependency factory — checks RBAC permission."""
    async def _inner(current_user: dict = Depends(get_current_user)) -> dict:
        allowed = ROLE_PERMISSIONS.get(current_user["role"], [])
        if permission not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user['role']}' does not have '{permission}' permission"
            )
        return current_user
    return _inner
