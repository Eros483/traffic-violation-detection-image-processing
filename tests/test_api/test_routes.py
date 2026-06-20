# ----- tests for fastapi endpoints @ tests/test_api/test_routes.py -----

import json
from pathlib import Path

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


def test_get_violations_with_pagination():
    """Test the violations list endpoint with pagination params."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/violations?page=2&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2


def test_get_violation_not_found():
    """Test that a missing violation ID returns 404."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/violations/nonexistent-uuid")
    assert response.status_code == 404


def test_get_analytics_summary():
    """Test the analytics summary endpoint."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_violations" in data


def test_get_analytics_metrics_not_found():
    """Test that missing metrics.json returns 404."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/analytics/metrics")
    assert response.status_code == 404


def test_get_evidence_image_not_found():
    """Test that a missing evidence image returns 404."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/evidence/nonexistent-uuid/image")
    assert response.status_code == 404


def test_get_evidence_metadata_not_found():
    """Test that missing evidence metadata returns 404."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.get("/api/evidence/nonexistent-uuid/metadata")
    assert response.status_code == 404


def test_process_image_invalid_path():
    """Test that process endpoint returns 400 for a non-existent image path."""
    if client is None:
        pytest.fail("FastAPI app not implemented yet!")

    response = client.post(
        "/api/violations/process",
        json={"image_path": "/nonexistent/path.jpg"},
    )
    assert response.status_code == 400
