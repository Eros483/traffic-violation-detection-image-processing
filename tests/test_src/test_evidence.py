# ----- tests for evidence packaging @ tests/test_src/test_evidence.py -----

import cv2
import numpy as np

from src.evidence import ViolationRecord, annotate_image, package_evidence


def test_package_evidence_generates_hash(tmp_path):
    """Test that package_evidence generates a SHA-256 hash for the image."""
    img_path = tmp_path / "test.jpg"
    cv2.imwrite(str(img_path), np.zeros((100, 100, 3), dtype=np.uint8))

    detections = [
        {
            "bbox": [10, 20, 100, 200],
            "vehicle_type": "two_wheeler",
            "violations": [{"type": "helmet", "confidence": 0.91, "description": "No helmet"}],
            "plate_bbox": None,
            "plate_text": None,
            "plate_confidence": None,
        }
    ]

    records = package_evidence(str(img_path), detections)
    assert len(records) == 1
    assert records[0].image_hash != "unknown"
    assert len(records[0].violation_id) > 0
    assert records[0].violations[0]["type"] == "helmet"


def test_package_evidence_handles_missing_image(tmp_path):
    """Test that package_evidence handles a non-existent image gracefully."""
    fake_path = str(tmp_path / "nonexistent.jpg")

    detections = [
        {
            "bbox": [10, 20, 100, 200],
            "vehicle_type": "two_wheeler",
            "violations": [{"type": "helmet", "confidence": 0.91, "description": "No helmet"}],
            "plate_bbox": None,
            "plate_text": None,
            "plate_confidence": None,
        }
    ]

    records = package_evidence(fake_path, detections)
    assert len(records) == 1
    assert records[0].image_hash == "unknown"


def test_severity_high_for_dangerous_violations(tmp_path):
    """Test that red_light and wrong_side_driving map to high severity."""
    img_path = tmp_path / "test.jpg"
    cv2.imwrite(str(img_path), np.zeros((100, 100, 3), dtype=np.uint8))

    detections = [
        {
            "bbox": [10, 20, 100, 200],
            "vehicle_type": "vehicle",
            "violations": [
                {"type": "red_light", "confidence": 0.85, "description": "Ran red light"}
            ],
            "plate_bbox": None,
            "plate_text": None,
            "plate_confidence": None,
        }
    ]

    records = package_evidence(str(img_path), detections)
    assert records[0].severity == "high"


def test_severity_high_for_stop_line(tmp_path):
    """Test that stop_line maps to high severity."""
    img_path = tmp_path / "test.jpg"
    cv2.imwrite(str(img_path), np.zeros((100, 100, 3), dtype=np.uint8))

    detections = [
        {
            "bbox": [10, 20, 100, 200],
            "vehicle_type": "vehicle",
            "violations": [
                {"type": "stop_line", "confidence": 0.85, "description": "Crossed stop line"}
            ],
            "plate_bbox": None,
            "plate_text": None,
            "plate_confidence": None,
        }
    ]

    records = package_evidence(str(img_path), detections)
    assert records[0].severity == "high"


def test_severity_standard_for_helmet(tmp_path):
    """Test that helmet violations map to standard severity."""
    img_path = tmp_path / "test.jpg"
    cv2.imwrite(str(img_path), np.zeros((100, 100, 3), dtype=np.uint8))

    detections = [
        {
            "bbox": [10, 20, 100, 200],
            "vehicle_type": "two_wheeler",
            "violations": [{"type": "helmet", "confidence": 0.91, "description": "No helmet"}],
            "plate_bbox": None,
            "plate_text": None,
            "plate_confidence": None,
        }
    ]

    records = package_evidence(str(img_path), detections)
    assert records[0].severity == "standard"


def test_legal_sections_mapped_correctly(tmp_path):
    """Test that legal sections are mapped per violation type."""
    img_path = tmp_path / "test.jpg"
    cv2.imwrite(str(img_path), np.zeros((100, 100, 3), dtype=np.uint8))

    detections = [
        {
            "bbox": [10, 20, 100, 200],
            "vehicle_type": "two_wheeler",
            "violations": [
                {"type": "helmet", "confidence": 0.91, "description": "No helmet"},
                {"type": "triple_riding", "confidence": 0.85, "description": "Triple riding"},
            ],
            "plate_bbox": None,
            "plate_text": None,
            "plate_confidence": None,
        }
    ]

    records = package_evidence(str(img_path), detections)
    assert "MV Act S129" in records[0].legal_sections  # helmet
    assert "MV Act S128" in records[0].legal_sections  # triple_riding


def test_new_legal_sections_mapped_correctly(tmp_path):
    """Test that newly added violation types have correct legal sections."""
    img_path = tmp_path / "test.jpg"
    cv2.imwrite(str(img_path), np.zeros((100, 100, 3), dtype=np.uint8))

    detections = [
        {
            "bbox": [10, 20, 100, 200],
            "vehicle_type": "vehicle",
            "violations": [
                {"type": "seatbelt", "confidence": 0.91, "description": "No seatbelt"},
                {"type": "stop_line", "confidence": 0.85, "description": "Stop line crossed"},
                {"type": "illegal_parking", "confidence": 0.75, "description": "Illegally parked"},
            ],
            "plate_bbox": None,
            "plate_text": None,
            "plate_confidence": None,
        }
    ]

    records = package_evidence(str(img_path), detections)
    assert "MV Act S194B" in records[0].legal_sections  # seatbelt
    assert "MV Act S119/177" in records[0].legal_sections  # stop_line
    assert "MV Act S122" in records[0].legal_sections  # illegal_parking


def test_annotate_image_draws_boxes_and_text(tmp_path):
    """Test that annotate_image draws bounding boxes and returns a valid image."""
    image = np.zeros((400, 400, 3), dtype=np.uint8)

    records = [
        ViolationRecord(
            violation_id="test-uuid",
            timestamp="2026-01-01T00:00:00",
            image_path=str(tmp_path / "test.jpg"),
            image_hash="abc123",
            vehicle_bbox=[50, 50, 200, 300],
            vehicle_type="two_wheeler",
            plate_number="KA-01-AB-1234",
            plate_confidence=0.92,
            violations=[{"type": "helmet", "confidence": 0.91, "description": "No helmet"}],
            severity="standard",
            legal_sections=["MV Act S129"],
        )
    ]

    annotated = annotate_image(image, records)
    assert isinstance(annotated, np.ndarray)
    assert annotated.shape == image.shape
    # Ensure the annotation modified the image (boxes drawn)
    assert not np.array_equal(annotated, image)
