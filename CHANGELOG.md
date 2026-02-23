# FinSight AI — changelog
All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] — 2026-02-22

### Added
- **PostgreSQL support** — database layer now dual-mode (SQLite dev / PostgreSQL prod) via `DATABASE_URL`
- **Rate limiting** — `slowapi` throttle on `/api/auth/login` (10 req/min per IP)
- **Token refresh** — `POST /api/auth/refresh` exchanges refresh token for new access token
- **Password policy** — enforces uppercase, digit, and special character on registration
- **User Management page** — admin-only frontend panel (list, role change, deactivate, delete, reset password)
- **Three.js auth animation** — floating financial graph canvas on login/signup page
- **pytest test suite** — 4 test modules covering auth, users, analytics, AI engine
- **GitHub Actions CI** — backend tests + frontend build + Docker image validation
- **Docker stack** — `Dockerfile` for backend & frontend, `docker-compose.yml` with PostgreSQL
- **ErrorBoundary** — catches React render crashes and shows styled fallback
- **Skeleton loading components** — shimmer placeholders for async data
- **404 Not Found page** — styled page for undefined routes
- **`constants.py`** — single source of truth for roles, permissions, and action names
- **Structured logging** — `logging` module replaces scattered `print` statements
- **CORS hardening** — environment-aware origins (wildcard dev / specific domain prod)

### Fixed
- Register endpoint permission check: `"admin"` → `"manage_users"` (roles ≠ permissions)
- Logout redirect: now navigates to `/login` via `useNavigate` instead of page reload

---

## [1.1.0] — 2026-02-21

### Added
- Authentication system: Login / Register / Logout with JWT + RBAC
- `AuthPage.jsx` with tabbed login/register forms and demo credential quick-fill
- `ProtectedLayout` auth guard in `App.jsx` — redirects unauthenticated users to `/login`
- `/api/auth/register` endpoint (admin-only)
- `/api/auth/logout` endpoint

---

## [1.0.0] — 2026-02-21

### Initial Release
- FastAPI backend with 6 modules: ingestion, analytics, AI engine, assistant, auth, audit
- React + Vite frontend with 6 pages: Dashboard, Analytics, Forecast, Transactions, Assistant
- SQLite database with WAL mode and index optimizations
- JWT authentication with bcrypt password hashing
- Role-based access control (admin / analyst / viewer)
- Cash flow analytics, Financial Health Score (0–100)
- AI-powered forecasting (exponential smoothing), anomaly detection (IQR), risk scoring
- Smart recommendation engine with category-aware suggestions
- AI Financial Assistant (intent-parsing + grounded responses)
- Audit logging middleware for all sensitive actions
- Synthetic sample dataset (500+ transactions)
