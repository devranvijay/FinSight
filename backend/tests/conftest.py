"""
FinSight AI — pytest shared fixtures
Uses a temporary file-based SQLite DB (not :memory:) because sqlite3 :memory:
databases are per-connection — each call to DB.fetch_all/execute would get a
fresh empty database.  The temp file is deleted after the test session.
"""
import os
import sys
import tempfile
import pytest

# ── Must be set BEFORE importing any app module ───────────────────────────────
_test_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_test_db.close()
os.environ["DATABASE_URL"] = _test_db.name
os.environ["ENVIRONMENT"]  = "development"
os.environ["SECRET_KEY"]   = "test-secret-key-at-least-32-characters-long-xxx"
os.environ["TESTING"]      = "1"   # disables rate limiting in main.py

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from httpx import AsyncClient, ASGITransport
from main import app
from database import init_db


@pytest.fixture(scope="session", autouse=True)
def initialise_db():
    """Create tables and seed users once per test session."""
    init_db()
    yield
    # cleanup temp DB file after all tests complete
    try:
        os.unlink(_test_db.name)
    except OSError:
        pass


@pytest.fixture
async def client():
    """Async HTTPX client wired to the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


@pytest.fixture
async def admin_token(client):
    """Return a valid admin JWT access token."""
    resp = await client.post(
        "/api/auth/login",
        data={"username": "admin@finsight.ai", "password": "Admin@123"},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
async def analyst_token(client):
    resp = await client.post(
        "/api/auth/login",
        data={"username": "analyst@finsight.ai", "password": "Analyst@123"},
    )
    assert resp.status_code == 200, f"Analyst login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture
async def viewer_token(client):
    resp = await client.post(
        "/api/auth/login",
        data={"username": "viewer@finsight.ai", "password": "Viewer@123"},
    )
    assert resp.status_code == 200, f"Viewer login failed: {resp.text}"
    return resp.json()["access_token"]
