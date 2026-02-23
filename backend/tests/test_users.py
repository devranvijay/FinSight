"""Tests for User Management endpoints (admin CRUD)."""
import pytest
pytestmark = pytest.mark.asyncio


class TestListUsers:
    async def test_admin_can_list_users(self, client, admin_token):
        r = await client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert "data" in r.json()
        assert r.json()["total"] >= 3  # at least the 3 seeded users

    async def test_analyst_cannot_list_users(self, client, analyst_token):
        r = await client.get("/api/users", headers={"Authorization": f"Bearer {analyst_token}"})
        assert r.status_code == 403

    async def test_viewer_cannot_list_users(self, client, viewer_token):
        r = await client.get("/api/users", headers={"Authorization": f"Bearer {viewer_token}"})
        assert r.status_code == 403


class TestUpdateUser:
    async def test_change_role(self, client, admin_token):
        # create a user first
        create = await client.post(
            "/api/auth/register",
            json={"email": "rolechange@test.ai", "password": "RoleChange@1", "role": "viewer"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        user_id = create.json()["id"]

        r = await client.patch(
            f"/api/users/{user_id}",
            json={"role": "analyst"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "analyst"

    async def test_toggle_active(self, client, admin_token):
        create = await client.post(
            "/api/auth/register",
            json={"email": "toggle@test.ai", "password": "Toggle@123", "role": "viewer"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        user_id = create.json()["id"]

        r = await client.patch(
            f"/api/users/{user_id}",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert r.status_code == 200
        assert r.json()["user"]["is_active"] in (0, False)


class TestDeleteUser:
    async def test_delete_user(self, client, admin_token):
        create = await client.post(
            "/api/auth/register",
            json={"email": "tobedeleted@test.ai", "password": "Delete@123!", "role": "viewer"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        user_id = create.json()["id"]

        r = await client.delete(
            f"/api/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_nonexistent_user_returns_404(self, client, admin_token):
        r = await client.delete(
            "/api/users/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert r.status_code == 404
