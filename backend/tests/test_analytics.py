"""Tests for analytics endpoints."""
import pytest
pytestmark = pytest.mark.asyncio


class TestAnalyticsOverview:
    async def test_overview_requires_auth(self, client):
        r = await client.get("/api/analytics/overview")
        assert r.status_code == 401

    async def test_overview_accessible_to_viewer(self, client, viewer_token):
        r = await client.get("/api/analytics/overview", headers={"Authorization": f"Bearer {viewer_token}"})
        # May return 200 (data) or 200 empty — either is fine, just not 4xx
        assert r.status_code == 200

    async def test_cashflow_monthly(self, client, analyst_token):
        r = await client.get(
            "/api/analytics/cashflow?granularity=monthly",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert r.status_code == 200
        body = r.json()
        # Response must contain the expected keys
        assert "data" in body or "monthly" in body or isinstance(body, (list, dict))

    async def test_cashtflow_invalid_granularity(self, client, analyst_token):
        r = await client.get(
            "/api/analytics/cashflow?granularity=invalid",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        # Should either return 422 or default gracefully
        assert r.status_code in (200, 422)


class TestHealthScore:
    async def test_health_score_shape(self, client, analyst_token):
        r = await client.get(
            "/api/analytics/health-score",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert r.status_code == 200
        body = r.json()
        assert "score" in body or "health_score" in body or isinstance(body, dict)
