# ----- tests for fastapi endpoints @ tests/test_api/test_routes.py -----

import pytest
from fastapi.testclient import TestClient

try:
    from api.main import app

    client = TestClient(app)
except ImportError:
    client = None


def test_health_endpoint():
    """Test the basic health check endpoint."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_violations():
    """Test the violations list endpoint."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/violations")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data


def test_get_analytics_summary():
    """Test the analytics summary endpoint."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_violations" in data
