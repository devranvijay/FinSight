"""Tests for authentication endpoints."""
import pytest
pytestmark = pytest.mark.asyncio


class TestLogin:
    async def test_login_valid_admin(self, client):
        r = await client.post("/api/auth/login", data={"username": "admin@finsight.ai", "password": "Admin@123"})
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["role"] == "admin"

    async def test_login_valid_analyst(self, client):
        r = await client.post("/api/auth/login", data={"username": "analyst@finsight.ai", "password": "Analyst@123"})
        assert r.status_code == 200
        assert r.json()["role"] == "analyst"

    async def test_login_wrong_password(self, client):
        r = await client.post("/api/auth/login", data={"username": "admin@finsight.ai", "password": "wrong"})
        assert r.status_code == 401

    async def test_login_unknown_user(self, client):
        r = await client.post("/api/auth/login", data={"username": "ghost@finsight.ai", "password": "anything"})
        assert r.status_code == 401


class TestMe:
    async def test_get_me_authenticated(self, client, admin_token):
        r = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    async def test_get_me_unauthenticated(self, client):
        r = await client.get("/api/auth/me")
        assert r.status_code == 401


class TestTokenRefresh:
    async def test_refresh_valid_token(self, client):
        login = await client.post("/api/auth/login", data={"username": "admin@finsight.ai", "password": "Admin@123"})
        refresh_token = login.json()["refresh_token"]
        r = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert r.status_code == 200
        assert "access_token" in r.json()

    async def test_refresh_invalid_token(self, client):
        r = await client.post("/api/auth/refresh", json={"refresh_token": "not.a.real.token"})
        assert r.status_code == 401


class TestRegister:
    async def test_register_requires_admin(self, client, analyst_token):
        r = await client.post(
            "/api/auth/register",
            json={"email": "new@test.ai", "password": "NewUser@123", "role": "viewer"},
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert r.status_code == 403

    async def test_register_weak_password(self, client, admin_token):
        r = await client.post(
            "/api/auth/register",
            json={"email": "new2@test.ai", "password": "weakpassword", "role": "viewer"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert r.status_code == 422

    async def test_register_success(self, client, admin_token):
        r = await client.post(
            "/api/auth/register",
            json={"email": "newuser@test.ai", "password": "NewUser@123!", "role": "analyst"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_register_duplicate_email(self, client, admin_token):
        await client.post(
            "/api/auth/register",
            json={"email": "dup@test.ai", "password": "Dupuser@123", "role": "viewer"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        r = await client.post(
            "/api/auth/register",
            json={"email": "dup@test.ai", "password": "Dupuser@123", "role": "viewer"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert r.status_code == 409
