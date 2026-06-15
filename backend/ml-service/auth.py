"""
JWT Authentication Module for SecondLife Commerce
Handles user registration, login, and token verification.
"""
# ── bcrypt / passlib compatibility shim ──────────────────────────────────────
# passlib < 1.7.5 tries to read bcrypt.__about__.__version__ which was removed
# in bcrypt 4.x.  Inject a dummy __about__ so the import succeeds silently.
import importlib, types

_bcrypt_mod = importlib.util.find_spec("bcrypt")
if _bcrypt_mod:
    import bcrypt as _bcrypt_pkg
    if not hasattr(_bcrypt_pkg, "__about__"):
        _about = types.ModuleType("bcrypt.__about__")
        _about.__version__ = getattr(_bcrypt_pkg, "__version__", "4.0.0")
        _bcrypt_pkg.__about__ = _about  # type: ignore
# ─────────────────────────────────────────────────────────────────────────────

import os
import uuid
import datetime
from typing import Optional, Dict

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

# --- Config ---
_DEFAULT_JWT_SECRET = "secondlife-super-secret-jwt-key-change-in-prod-2026"
JWT_SECRET = os.getenv("JWT_SECRET", _DEFAULT_JWT_SECRET)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72  # 3 days

if os.getenv("APP_ENV", "development") == "production" and JWT_SECRET == _DEFAULT_JWT_SECRET:
    raise RuntimeError("JWT_SECRET must be set to a strong value when APP_ENV=production")
elif JWT_SECRET == _DEFAULT_JWT_SECRET:
    print("WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env before production deployment.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

# --- Pydantic Models ---
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "buyer"  # buyer | seller | admin

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict

# --- In-Memory User Store (replaces DB for demo; swap with DynamoDB in prod) ---
# Shape: { email: { id, email, name, role, hashed_password } }
_USER_STORE: Dict[str, Dict] = {}

# Pre-seed demo accounts so the app works out of the box
def _seed_demo_users():
    demo_accounts = [
        {"email": "buyer@demo.com",  "name": "Priya S.",      "role": "buyer",  "password": "buyer123"},
        {"email": "seller@demo.com", "name": "Rahul M.",      "role": "seller", "password": "seller123"},
        {"email": "admin@demo.com",  "name": "Naman A.",      "role": "admin",  "password": "admin123"},
    ]
    for acc in demo_accounts:
        if acc["email"] not in _USER_STORE:
            _USER_STORE[acc["email"]] = {
                "id": f"usr-{str(uuid.uuid4())[:8]}",
                "email": acc["email"],
                "name": acc["name"],
                "role": acc["role"],
                "hashed_password": pwd_context.hash(acc["password"]),
                "created_at": datetime.datetime.utcnow().isoformat() + "Z",
                "green_credits": 500,
                "co2_saved_kg": 22.4,
            }

_seed_demo_users()

# --- Helpers ---
def _hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def _create_token(user: Dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def _decode_token(token: str) -> Optional[Dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def _safe_user(user: Dict) -> Dict:
    """Return user dict without sensitive fields."""
    return {k: v for k, v in user.items() if k != "hashed_password"}

# --- Auth Operations ---
def register_user(req: RegisterRequest) -> TokenResponse:
    if req.email in _USER_STORE:
        raise HTTPException(status_code=409, detail="Email already registered")
    if req.role not in ("buyer", "seller", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be buyer, seller, or admin")

    user = {
        "id": f"usr-{str(uuid.uuid4())[:8]}",
        "email": req.email,
        "name": req.name,
        "role": req.role,
        "hashed_password": _hash_password(req.password),
        "created_at": datetime.datetime.utcnow().isoformat() + "Z",
        "green_credits": 0,
        "co2_saved_kg": 0.0,
    }
    _USER_STORE[req.email] = user
    token = _create_token(user)
    return TokenResponse(access_token=token, user=_safe_user(user))

def login_user(req: LoginRequest) -> TokenResponse:
    user = _USER_STORE.get(req.email)
    if not user or not _verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = _create_token(user)
    return TokenResponse(access_token=token, user=_safe_user(user))

# --- FastAPI Dependency ---
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> Dict:
    """Dependency: validates JWT and returns user payload. Raises 401 if missing/invalid."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _decode_token(credentials.credentials)

def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> Optional[Dict]:
    """Optional auth — returns None if no/bad token (useful for public routes that show extra info when logged in)."""
    if not credentials:
        return None
    try:
        return _decode_token(credentials.credentials)
    except HTTPException:
        return None

def require_role(*roles: str):
    """Factory for role-based access control dependencies."""
    def _checker(user: Dict = Depends(get_current_user)) -> Dict:
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(roles)}"
            )
        return user
    return _checker
