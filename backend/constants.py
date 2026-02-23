"""
FinSight AI — Application Constants
Single source of truth for roles, permissions, and configuration values.
"""

# ── User Roles ─────────────────────────────────────────────────────────────────
ROLES = ("admin", "analyst", "viewer")

# ── Role-Based Permission Map ──────────────────────────────────────────────────
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin":   ["read", "write", "delete", "manage_users", "view_audit"],
    "analyst": ["read", "write"],
    "viewer":  ["read"],
}

# ── Password Policy ────────────────────────────────────────────────────────────
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_DIGIT     = True
PASSWORD_REQUIRE_SPECIAL   = True
PASSWORD_SPECIAL_CHARS     = "@$!%*?&#^"

# ── Token Settings ─────────────────────────────────────────────────────────────
ACCESS_TOKEN_EXPIRE_MINUTES  = 60
REFRESH_TOKEN_EXPIRE_DAYS    = 7

# ── Environments ───────────────────────────────────────────────────────────────
ENV_DEVELOPMENT = "development"
ENV_STAGING     = "staging"
ENV_PRODUCTION  = "production"

# ── Allowed Origins (CORS) ─────────────────────────────────────────────────────
ALLOWED_ORIGINS_DEV  = ["http://localhost:5173", "http://127.0.0.1:5173"]
ALLOWED_ORIGINS_PROD = ["https://finsight.yourdomain.com"]  # update before deploy

# ── Pagination Defaults ────────────────────────────────────────────────────────
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE     = 200

# ── Audit Log Actions ──────────────────────────────────────────────────────────
ACTION_LOGIN          = "LOGIN"
ACTION_LOGOUT         = "LOGOUT"
ACTION_LOGIN_FAILED   = "LOGIN_FAILED"
ACTION_REGISTER       = "REGISTER"
ACTION_DELETE_USER    = "DELETE_USER"
ACTION_UPDATE_USER    = "UPDATE_USER_ROLE"
ACTION_TOGGLE_USER    = "TOGGLE_USER"
ACTION_RESET_PASSWORD = "RESET_PASSWORD"
ACTION_INGEST         = "INGEST"
ACTION_DELETE_TXN     = "DELETE_TXN"
