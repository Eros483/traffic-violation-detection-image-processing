# ----- tests for detector mapping logic @ tests/test_src/test_detector.py -----

from unittest.mock import MagicMock, patch

import numpy as np


def test_detect_violations_returns_empty_when_model_not_loaded():
    """Test that detector gracefully returns empty when no trained model exists."""
    from src.detector import detect_violations, model

    if model is not None:
        import pytest

        pytest.skip("Model is loaded — this test only applies when weights are absent")

    image = np.zeros((640, 640, 3), dtype=np.uint8)
    result = detect_violations(image)
    assert result == []


@patch("src.detector.model")
def test_without_helmet_maps_to_helmet_violation(mock_model):
    """Test that WithoutHelmet class triggers a helmet violation."""
    from src.detector import detect_violations

    # Simulate YOLO detection for a WithoutHelmet instance
    mock_box = MagicMock()
    mock_box.cls = [2]  # Class index for WithoutHelmet
    mock_box.conf = [0.91]
    mock_box.xyxy = [[100, 100, 200, 350]]

    mock_result = MagicMock()
    mock_result.boxes = [mock_box]
    mock_result.names = {0: "Plate", 1: "WithHelmet", 2: "WithoutHelmet", 3: "TripleRiding"}

    mock_model.return_value = [mock_result]

    image = np.zeros((640, 640, 3), dtype=np.uint8)
    results = detect_violations(image)

    assert len(results) == 1
    assert results[0]["violations"][0]["type"] == "helmet"
    assert results[0]["vehicle_type"] == "two_wheeler"


@patch("src.detector.model")
def test_triple_riding_maps_to_triple_violation(mock_model):
    """Test that TripleRiding class triggers a triple_riding violation."""
    from src.detector import detect_violations

    mock_box = MagicMock()
    mock_box.cls = [3]  # Class index for TripleRiding
    mock_box.conf = [0.87]
    mock_box.xyxy = [[100, 100, 200, 350]]

    mock_result = MagicMock()
    mock_result.boxes = [mock_box]
    mock_result.names = {0: "Plate", 1: "WithHelmet", 2: "WithoutHelmet", 3: "TripleRiding"}

    mock_model.return_value = [mock_result]

    image = np.zeros((640, 640, 3), dtype=np.uint8)
    results = detect_violations(image)

    assert len(results) == 1
    assert results[0]["violations"][0]["type"] == "triple_riding"
    assert results[0]["vehicle_type"] == "two_wheeler"


@patch("src.detector.model")
def test_with_helmet_does_not_trigger_violation(mock_model):
    """Test that WithHelmet class produces no violation."""
    from src.detector import detect_violations

    mock_box = MagicMock()
    mock_box.cls = [1]  # Class index for WithHelmet
    mock_box.conf = [0.95]
    mock_box.xyxy = [[100, 100, 200, 350]]

    mock_result = MagicMock()
    mock_result.boxes = [mock_box]
    mock_result.names = {0: "Plate", 1: "WithHelmet", 2: "WithoutHelmet", 3: "TripleRiding"}

    mock_model.return_value = [mock_result]

    image = np.zeros((640, 640, 3), dtype=np.uint8)
    results = detect_violations(image)

    assert len(results) == 0


@patch("src.detector.model")
def test_plate_is_collected_not_emitted_as_violation(mock_model):
    """Test that Plate detections are collected for association, not emitted as violations."""
    from src.detector import detect_violations

    # Only a plate — no violation candidate
    mock_plate = MagicMock()
    mock_plate.cls = [0]
    mock_plate.conf = [0.88]
    mock_plate.xyxy = [[150, 320, 250, 360]]

    mock_result = MagicMock()
    mock_result.boxes = [mock_plate]
    mock_result.names = {0: "Plate", 1: "WithHelmet", 2: "WithoutHelmet", 3: "TripleRiding"}

    mock_model.return_value = [mock_result]

    image = np.zeros((640, 640, 3), dtype=np.uint8)
    results = detect_violations(image)

    assert len(results) == 0  # No violation emitted for plates alone
