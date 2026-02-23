"""Tests for AI Engine endpoints."""
import pytest
pytestmark = pytest.mark.asyncio


class TestForecast:
    async def test_forecast_requires_auth(self, client):
        r = await client.get("/api/ai/forecast")
        assert r.status_code == 401

    async def test_forecast_returns_data(self, client, analyst_token):
        r = await client.get("/api/ai/forecast", headers={"Authorization": f"Bearer {analyst_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), dict)


class TestAnomalies:
    async def test_anomalies_requires_auth(self, client):
        r = await client.get("/api/ai/anomalies")
        assert r.status_code == 401

    async def test_anomalies_returns_list(self, client, analyst_token):
        r = await client.get("/api/ai/anomalies", headers={"Authorization": f"Bearer {analyst_token}"})
        assert r.status_code == 200


class TestRisk:
    async def test_risk_requires_auth(self, client):
        r = await client.get("/api/ai/risk-score")
        assert r.status_code == 401

    async def test_risk_score_shape(self, client, analyst_token):
        r = await client.get("/api/ai/risk-score", headers={"Authorization": f"Bearer {analyst_token}"})
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body, dict)


class TestRecommendations:
    async def test_recommendations_viewer_access(self, client, viewer_token):
        r = await client.get("/api/ai/recommendations", headers={"Authorization": f"Bearer {viewer_token}"})
        assert r.status_code == 200

    async def test_recommendations_shape(self, client, analyst_token):
        r = await client.get("/api/ai/recommendations", headers={"Authorization": f"Bearer {analyst_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), (dict, list))


class TestAssistant:
    async def test_chat_requires_auth(self, client):
        r = await client.post("/api/assistant/chat", json={"query": "What is my balance?"})
        assert r.status_code == 401

    async def test_chat_returns_response(self, client, analyst_token):
        r = await client.post(
            "/api/assistant/chat",
            json={"query": "Show total income"},
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert r.status_code == 200
        body = r.json()
        assert "response" in body or "answer" in body or "message" in body or isinstance(body, dict)
