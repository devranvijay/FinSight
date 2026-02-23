"""
FinSight AI — Database Layer
Dual-mode: SQLite (development) and PostgreSQL (production).
Controlled entirely by the DATABASE_URL environment variable.
  - SQLite:     DATABASE_URL=finsight.db
  - PostgreSQL: DATABASE_URL=postgresql://user:pass@host:5432/dbname
"""
import os
import uuid
import logging
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "finsight.db")
_IS_POSTGRES = DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres")


# ── Schema (ANSI SQL — compatible with both engines) ──────────────────────────
_SQLITE_TABLES = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS accounts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT,
    currency    TEXT DEFAULT 'USD',
    balance     REAL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    date            DATE NOT NULL,
    amount          REAL NOT NULL,
    type            TEXT CHECK(type IN ('income','expense','transfer')),
    category        TEXT,
    sub_category    TEXT,
    description     TEXT,
    account_id      TEXT DEFAULT 'default',
    counterparty    TEXT,
    currency        TEXT DEFAULT 'USD',
    is_recurring    INTEGER DEFAULT 0,
    confidence      REAL DEFAULT 1.0,
    raw_description TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT CHECK(role IN ('admin','analyst','viewer')) DEFAULT 'viewer',
    is_active     INTEGER DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT,
    action      TEXT,
    resource    TEXT,
    details     TEXT,
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address  TEXT,
    status      TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_account  ON transactions(account_id);
"""

_PG_TABLES = """
CREATE TABLE IF NOT EXISTS accounts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT,
    currency    TEXT DEFAULT 'USD',
    balance     DOUBLE PRECISION DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    date            DATE NOT NULL,
    amount          DOUBLE PRECISION NOT NULL,
    type            TEXT CHECK(type IN ('income','expense','transfer')),
    category        TEXT,
    sub_category    TEXT,
    description     TEXT,
    account_id      TEXT,
    counterparty    TEXT,
    currency        TEXT DEFAULT 'USD',
    is_recurring    INTEGER DEFAULT 0,
    confidence      DOUBLE PRECISION DEFAULT 1.0,
    raw_description TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT CHECK(role IN ('admin','analyst','viewer')) DEFAULT 'viewer',
    is_active     INTEGER DEFAULT 1,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     TEXT,
    action      TEXT,
    resource    TEXT,
    details     TEXT,
    timestamp   TIMESTAMP DEFAULT NOW(),
    ip_address  TEXT,
    status      TEXT
);

CREATE INDEX IF NOT EXISTS idx_txn_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_txn_type     ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_txn_account  ON transactions(account_id);
"""


# ── Connection helpers ─────────────────────────────────────────────────────────
def get_connection():
    if _IS_POSTGRES:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        return conn
    else:
        import sqlite3
        conn = sqlite3.connect(DATABASE_URL, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn


@contextmanager
def get_db():
    """Context manager — always closes connection."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _row_to_dict(row):
    """Normalize row from both sqlite3.Row and psycopg2 RealDictRow."""
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    try:
        return dict(row)
    except Exception:
        return {k: row[k] for k in row.keys()}


def _execute_schema(conn, sql: str):
    """Execute a multi-statement schema script on either engine."""
    if _IS_POSTGRES:
        import psycopg2
        cur = conn.cursor()
        for statement in sql.strip().split(";"):
            s = statement.strip()
            if s:
                cur.execute(s)
        conn.commit()
    else:
        conn.executescript(sql)
        conn.commit()


# ── DB initializer ─────────────────────────────────────────────────────────────
def init_db():
    """Create tables and seed default users if they don't exist."""
    import bcrypt as _bcrypt

    conn = get_connection()
    try:
        schema = _PG_TABLES if _IS_POSTGRES else _SQLITE_TABLES
        _execute_schema(conn, schema)

        # ── Seed default account ──────────────────────────────────────────────
        if _IS_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO accounts (id, name, type) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                ('default', 'Default Account', 'checking')
            )
        else:
            conn.execute(
                "INSERT OR IGNORE INTO accounts (id, name, type) VALUES (?, ?, ?)",
                ('default', 'Default Account', 'checking')
            )
        conn.commit()

        def _hash(pw: str) -> str:
            return _bcrypt.hashpw(pw.encode(), _bcrypt.gensalt()).decode()

        if _IS_POSTGRES:
            import psycopg2.extras
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT id FROM users WHERE email = %s", ("admin@finsight.ai",))
            exists = cur.fetchone()
        else:
            cur = conn.execute("SELECT id FROM users WHERE email = ?", ("admin@finsight.ai",))
            exists = cur.fetchone()

        if not exists:
            seed_users = [
                (str(uuid.uuid4()), "admin@finsight.ai",   _hash("Admin@123"),   "admin"),
                (str(uuid.uuid4()), "analyst@finsight.ai", _hash("Analyst@123"), "analyst"),
                (str(uuid.uuid4()), "viewer@finsight.ai",  _hash("Viewer@123"),  "viewer"),
            ]
            if _IS_POSTGRES:
                cur = conn.cursor()
                cur.executemany(
                    "INSERT INTO users (id, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                    seed_users
                )
            else:
                conn.executemany(
                    "INSERT INTO users (id, email, password_hash, role) VALUES (?,?,?,?)",
                    seed_users
                )
            conn.commit()
            logger.info("Seeded default admin/analyst/viewer users")
        else:
            logger.info("Database already initialized")
    finally:
        conn.close()


# ── DB Access class ────────────────────────────────────────────────────────────
class DB:
    """
    Database access helper — automatically handles SQLite vs PostgreSQL.
    Uses ? placeholders internally; converts to %s for PostgreSQL.
    """

    @staticmethod
    def _adapt(query: str) -> str:
        """Convert SQLite '?' placeholders to PostgreSQL '%s'."""
        if _IS_POSTGRES:
            return query.replace("?", "%s")
        return query

    @staticmethod
    def fetch_all(query: str, params: tuple = ()) -> list[dict]:
        with get_db() as conn:
            if _IS_POSTGRES:
                import psycopg2.extras
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute(DB._adapt(query), params)
                return [dict(r) for r in cur.fetchall()]
            else:
                rows = conn.execute(query, params).fetchall()
                return [dict(r) for r in rows]

    @staticmethod
    def fetch_one(query: str, params: tuple = ()) -> dict | None:
        with get_db() as conn:
            if _IS_POSTGRES:
                import psycopg2.extras
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute(DB._adapt(query), params)
                row = cur.fetchone()
                return dict(row) if row else None
            else:
                row = conn.execute(query, params).fetchone()
                return dict(row) if row else None

    @staticmethod
    def execute(query: str, params: tuple = ()):
        with get_db() as conn:
            if _IS_POSTGRES:
                cur = conn.cursor()
                cur.execute(DB._adapt(query), params)
            else:
                conn.execute(query, params)

    @staticmethod
    def executemany(query: str, params_list: list):
        with get_db() as conn:
            if _IS_POSTGRES:
                cur = conn.cursor()
                cur.executemany(DB._adapt(query), params_list)
            else:
                conn.executemany(query, params_list)
