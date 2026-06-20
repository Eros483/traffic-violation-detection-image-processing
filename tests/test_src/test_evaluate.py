# ----- tests for evaluation script @ tests/test_src/test_evaluate.py -----

import uuid
from datetime import datetime

import json
import os
from unittest.mock import MagicMock, patch

import pytest


def test_evaluate_script_generates_metrics():
    """Test that the evaluation script writes metrics.json without running real CV validation."""
    original_exists = os.path.exists

    def _mock_exists(path):
        p = str(path)
        if "best.pt" in p or "data.yaml" in p:
            return True
        return original_exists(path)

    with (
        patch("src.evaluate.YOLO") as mock_yolo,
        patch("os.path.exists", side_effect=_mock_exists),
    ):
        mock_model_instance = MagicMock()
        mock_metrics = MagicMock()

        mock_metrics.box.map50 = 0.85
        mock_metrics.box.map = 0.72
        mock_metrics.box.mp = 0.80
        mock_metrics.box.mr = 0.90
        mock_model_instance.val.return_value = mock_metrics
        mock_yolo.return_value = mock_model_instance

        try:
            from src.evaluate import generate_metrics
        except ImportError:
            pytest.fail("src/evaluate.py has not been implemented yet!")

        test_output_path = "outputs/test_metrics.json"

        generate_metrics(output_path=test_output_path)

        assert os.path.exists(test_output_path)

        with open(test_output_path, "r") as f:
            data = json.load(f)

        assert data["detector"]["mAP50"] == 0.85
        assert data["detector"]["precision"] == 0.80
        assert data["detector"]["recall"] == 0.90

        os.remove(test_output_path)


def test_evaluate_script_returns_error_when_model_missing():
    """Test that the evaluation script writes an error status when model weights are absent."""
    original_exists = os.path.exists

    def _mock_exists(path):
        p = str(path)
        if "best.pt" in p:
            return False
        return original_exists(path)

    with patch("os.path.exists", side_effect=_mock_exists):
        from src.evaluate import generate_metrics

        test_output_path = "outputs/test_metrics_error.json"

        if os.path.exists(test_output_path):
            os.remove(test_output_path)

        generate_metrics(output_path=test_output_path)

        assert os.path.exists(test_output_path)

        with open(test_output_path, "r") as f:
            data = json.load(f)

        assert data["status"] == "error"
        assert "not found" in data["message"].lower()

        os.remove(test_output_path)


# ----- tests for LPR accuracy evaluation -----


def test_evaluate_lpr_computes_accuracy(tmp_path):
    """Test that evaluate_lpr computes perfect accuracy when OCR matches GT."""
    from src.evaluate import evaluate_lpr

    ann_dir = tmp_path / "Annotations"
    img_dir = tmp_path / "images"
    ann_dir.mkdir()
    img_dir.mkdir()

    xml_content = """<?xml version="1.0"?>
<annotation>
  <filename>test.jpg</filename>
  <size><width>200</width><height>200</height></size>
  <object>
    <name>number_plate</name>
    <bndbox>
      <xmin>10</xmin><ymin>10</ymin><xmax>100</xmax><ymax>50</ymax>
    </bndbox>
    <attributes>
      <attribute>
        <name>number_plate_text</name>
        <value>KA01AB1234</value>
      </attribute>
    </attributes>
  </object>
</annotation>"""
    (ann_dir / "test.xml").write_text(xml_content)

    import cv2
    import numpy as np

    img = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.imwrite(str(img_dir / "test.jpg"), img)

    with patch("src.lpr.read_plate") as mock_read:
        mock_read.return_value = {
            "text": "KA-01-AB-1234",
            "confidence": 0.95,
            "valid": True,
            "raw": "KA-01-AB-1234",
        }

        output_path = tmp_path / "metrics.json"
        evaluate_lpr(
            annotations_dir=str(ann_dir),
            images_dir=str(img_dir),
            output_path=str(output_path),
        )

        assert output_path.exists()
        data = json.loads(output_path.read_text())
        assert "lpr" in data
        assert data["lpr"]["num_plates_evaluated"] == 1
        assert data["lpr"]["character_accuracy"] == 1.0
        assert data["lpr"]["full_plate_accuracy"] == 1.0
        assert data["lpr"]["per_plate_results"][0]["full_match"] is True


def test_evaluate_lpr_handles_ocr_errors(tmp_path):
    """Test that evaluate_lpr correctly degrades accuracy when OCR output is wrong."""
    from src.evaluate import evaluate_lpr

    ann_dir = tmp_path / "Annotations"
    img_dir = tmp_path / "images"
    ann_dir.mkdir()
    img_dir.mkdir()

    xml_content = """<?xml version="1.0"?>
<annotation>
  <filename>test.jpg</filename>
  <size><width>200</width><height>200</height></size>
  <object>
    <name>number_plate</name>
    <bndbox>
      <xmin>10</xmin><ymin>10</ymin><xmax>100</xmax><ymax>50</ymax>
    </bndbox>
    <attributes>
      <attribute>
        <name>number_plate_text</name>
        <value>KA01AB1234</value>
      </attribute>
    </attributes>
  </object>
</annotation>"""
    (ann_dir / "test.xml").write_text(xml_content)

    import cv2
    import numpy as np

    img = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.imwrite(str(img_dir / "test.jpg"), img)

    with patch("src.lpr.read_plate") as mock_read:
        mock_read.return_value = {
            "text": "KA-01-XX-9999",
            "confidence": 0.80,
            "valid": True,
            "raw": "KA-01-XX-9999",
        }

        output_path = tmp_path / "metrics.json"
        evaluate_lpr(
            annotations_dir=str(ann_dir),
            images_dir=str(img_dir),
            output_path=str(output_path),
        )

        data = json.loads(output_path.read_text())
        assert data["lpr"]["num_plates_evaluated"] == 1
        assert data["lpr"]["full_plate_accuracy"] == 0.0
        assert data["lpr"]["character_accuracy"] < 1.0
        assert data["lpr"]["per_plate_results"][0]["full_match"] is False


def test_evaluate_lpr_skips_xmls_without_gt(tmp_path):
    """Test that XMLs without number_plate_text attribute are skipped."""
    from src.evaluate import evaluate_lpr

    ann_dir = tmp_path / "Annotations"
    img_dir = tmp_path / "images"
    ann_dir.mkdir()
    img_dir.mkdir()

    xml_content = """<?xml version="1.0"?>
<annotation>
  <filename>test.jpg</filename>
  <size><width>200</width><height>200</height></size>
  <object>
    <name>number_plate</name>
    <bndbox>
      <xmin>10</xmin><ymin>10</ymin><xmax>100</xmax><ymax>50</ymax>
    </bndbox>
  </object>
</annotation>"""
    (ann_dir / "test.xml").write_text(xml_content)

    import cv2
    import numpy as np

    img = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.imwrite(str(img_dir / "test.jpg"), img)

    with patch("src.lpr.read_plate") as mock_read:
        output_path = tmp_path / "metrics.json"
        evaluate_lpr(
            annotations_dir=str(ann_dir),
            images_dir=str(img_dir),
            output_path=str(output_path),
        )

        data = json.loads(output_path.read_text())
        assert data["lpr"]["num_plates_evaluated"] == 0
        assert data["lpr"]["full_plate_accuracy"] == 0.0
        assert data["lpr"]["character_accuracy"] == 0.0


def test_evaluate_lpr_merges_with_existing_metrics(tmp_path):
    """Test that evaluate_lpr merges lpr key into existing metrics.json without clobbering."""
    from src.evaluate import evaluate_lpr

    ann_dir = tmp_path / "Annotations"
    img_dir = tmp_path / "images"
    ann_dir.mkdir()
    img_dir.mkdir()

    xml_content = """<?xml version="1.0"?>
<annotation>
  <filename>test.jpg</filename>
  <size><width>200</width><height>200</height></size>
  <object>
    <name>number_plate</name>
    <bndbox>
      <xmin>10</xmin><ymin>10</ymin><xmax>100</xmax><ymax>50</ymax>
    </bndbox>
    <attributes>
      <attribute>
        <name>number_plate_text</name>
        <value>KA01AB1234</value>
      </attribute>
    </attributes>
  </object>
</annotation>"""
    (ann_dir / "test.xml").write_text(xml_content)

    import cv2
    import numpy as np

    img = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.imwrite(str(img_dir / "test.jpg"), img)

    output_path = tmp_path / "metrics.json"
    existing = {"detector": {"mAP50": 0.85, "status": "success"}}
    output_path.write_text(json.dumps(existing))

    with patch("src.lpr.read_plate") as mock_read:
        mock_read.return_value = {
            "text": "KA-01-AB-1234",
            "confidence": 0.95,
            "valid": True,
            "raw": "KA-01-AB-1234",
        }
        evaluate_lpr(
            annotations_dir=str(ann_dir),
            images_dir=str(img_dir),
            output_path=str(output_path),
        )

        data = json.loads(output_path.read_text())
        assert data["detector"]["mAP50"] == 0.85
        assert data["detector"]["status"] == "success"
        assert "lpr" in data
        assert data["lpr"]["num_plates_evaluated"] == 1


def test_evaluate_lpr_multiple_plates_same_image(tmp_path):
    """Test that evaluate_lpr handles multiple plate objects in one image."""
    from src.evaluate import evaluate_lpr

    ann_dir = tmp_path / "Annotations"
    img_dir = tmp_path / "images"
    ann_dir.mkdir()
    img_dir.mkdir()

    xml_content = """<?xml version="1.0"?>
<annotation>
  <filename>test.jpg</filename>
  <size><width>300</width><height>300</height></size>
  <object>
    <name>number_plate</name>
    <bndbox>
      <xmin>10</xmin><ymin>10</ymin><xmax>100</xmax><ymax>50</ymax>
    </bndbox>
    <attributes>
      <attribute>
        <name>number_plate_text</name>
        <value>KA01AB1234</value>
      </attribute>
    </attributes>
  </object>
  <object>
    <name>number_plate</name>
    <bndbox>
      <xmin>150</xmin><ymin>150</ymin><xmax>250</xmax><ymax>190</ymax>
    </bndbox>
    <attributes>
      <attribute>
        <name>number_plate_text</name>
        <value>KL34A465</value>
      </attribute>
    </attributes>
  </object>
</annotation>"""
    (ann_dir / "test.xml").write_text(xml_content)

    import cv2
    import numpy as np

    img = np.zeros((300, 300, 3), dtype=np.uint8)
    cv2.imwrite(str(img_dir / "test.jpg"), img)

    with patch("src.lpr.read_plate") as mock_read:
        mock_read.side_effect = [
            {"text": "KA-01-AB-1234", "confidence": 0.95, "valid": True, "raw": "KA-01-AB-1234"},
            {"text": "KL34A465", "confidence": 0.88, "valid": False, "raw": "KL34A465"},
        ]

        output_path = tmp_path / "metrics.json"
        evaluate_lpr(
            annotations_dir=str(ann_dir),
            images_dir=str(img_dir),
            output_path=str(output_path),
        )

        data = json.loads(output_path.read_text())
        assert data["lpr"]["num_plates_evaluated"] == 2
        assert data["lpr"]["num_images_with_gt"] == 1
        assert data["lpr"]["full_plate_accuracy"] == 1.0
        assert data["lpr"]["character_accuracy"] == 1.0


# ----- tests for pipeline benchmark -----


def _make_test_image(tmp_path, name, w=200, h=200):
    """Create a dummy image file at tmp_path/name and return its full path."""
    import cv2
    import numpy as np

    img = np.zeros((h, w, 3), dtype=np.uint8)
    path = tmp_path / name
    cv2.imwrite(str(path), img)
    return str(path)


def _mock_package_evidence(image_path, detections):
    """Return a single ViolationRecord with default values."""
    from src.evidence import ViolationRecord

    rec = ViolationRecord(
        violation_id=str(uuid.uuid4()),
        timestamp=datetime.now().isoformat(),
        image_path=image_path,
        image_hash="abc123",
        vehicle_bbox=[10, 10, 100, 100],
        vehicle_type="two_wheeler",
        plate_number="KA-01-AB-1234",
        plate_confidence=0.95,
        violations=[{"type": "helmet", "confidence": 0.85, "description": "No helmet"}],
        severity="standard",
        legal_sections=["MV Act S129"],
    )
    return [rec]


def test_benchmark_pipeline_produces_metrics(tmp_path):
    """Test that benchmark_pipeline writes all expected keys."""
    from src.evaluate import benchmark_pipeline

    img1 = _make_test_image(tmp_path, "img1.jpg")
    _make_test_image(tmp_path, "img2.jpg")
    _make_test_image(tmp_path, "img3.jpg")

    output_path = tmp_path / "metrics.json"

    with (
        patch("src.preprocessing.preprocess") as mock_preprocess,
        patch("src.detector.detect_violations") as mock_detect,
        patch("src.lpr.read_plate") as mock_read,
        patch("src.llm_classifier.evaluate_image_level_violations") as mock_llm,
        patch("src.evidence.package_evidence", side_effect=_mock_package_evidence),
        patch("src.evidence.annotate_image") as mock_annotate,
    ):
        import numpy as np

        dummy_img = np.zeros((200, 200, 3), dtype=np.uint8)
        mock_preprocess.return_value = (dummy_img, [])
        mock_detect.return_value = [
            {
                "bbox": [10, 10, 100, 100],
                "vehicle_type": "two_wheeler",
                "violations": [{"type": "helmet", "confidence": 0.85, "description": "No helmet"}],
                "plate_bbox": [50, 50, 100, 80],
                "plate_text": None,
                "plate_confidence": None,
            }
        ]
        mock_read.return_value = {
            "text": "KA-01-AB-1234",
            "confidence": 0.95,
            "valid": True,
            "raw": "KA-01-AB-1234",
        }
        mock_llm.return_value = [
            {"type": "mobile_phone", "confidence": 0.75, "description": "Phone usage"}
        ]
        mock_annotate.return_value = dummy_img

        result = benchmark_pipeline(
            image_dir=str(tmp_path), output_path=str(output_path), skip_llm=False, num_warmup=0
        )

    assert result["benchmark"]["status"] == "success"
    assert result["benchmark"]["num_images"] == 3
    assert result["benchmark"]["num_skipped"] == 0
    assert result["benchmark"]["total_time_seconds"] > 0
    assert result["benchmark"]["throughput_images_per_sec"] > 0
    assert "per_stage_timing" in result["benchmark"]
    assert "per_stage_memory" in result["benchmark"]
    assert "per_image" in result["benchmark"]
    assert len(result["benchmark"]["per_image"]) == 3
    assert "hardware" in result["benchmark"]

    stages = result["benchmark"]["per_stage_timing"]
    for key in (
        "preprocess_ms",
        "detect_ms",
        "ocr_ms",
        "llm_ms",
        "evidence_ms",
        "annotation_ms",
        "total_ms",
    ):
        assert key in stages
        for metric in ("mean", "std", "min", "max", "total"):
            assert metric in stages[key]

    mem = result["benchmark"]["per_stage_memory"]
    for key in ("preprocess_mb", "detect_mb", "ocr_mb", "llm_mb", "evidence_mb", "annotation_mb"):
        assert key in mem
        for metric in ("mean_delta_mb", "max_delta_mb", "min_delta_mb"):
            assert metric in mem[key]

    for entry in result["benchmark"]["per_image"]:
        assert "memory_mb" in entry
        for stage in ("preprocess_mb", "detect_mb", "ocr_mb", "evidence_mb", "annotation_mb"):
            assert stage in entry["memory_mb"]
            for field in ("start", "end", "delta"):
                assert field in entry["memory_mb"][stage]

    assert output_path.exists()
    saved = json.loads(output_path.read_text())
    assert "benchmark" in saved


def test_benchmark_pipeline_empty_directory(tmp_path):
    """Test that benchmark_pipeline returns error when no images exist."""
    from src.evaluate import benchmark_pipeline

    output_path = tmp_path / "metrics.json"
    result = benchmark_pipeline(image_dir=str(tmp_path), output_path=str(output_path))

    assert result["benchmark"]["status"] == "error"
    assert "No images found" in result["benchmark"]["message"]
    assert output_path.exists()
    saved = json.loads(output_path.read_text())
    assert saved["benchmark"]["status"] == "error"


def test_benchmark_pipeline_merges_existing(tmp_path):
    """Test that benchmark merges with existing detector/LPR keys."""
    from src.evaluate import benchmark_pipeline

    _make_test_image(tmp_path, "img1.jpg")

    output_path = tmp_path / "metrics.json"
    existing = {
        "detector": {"mAP50": 0.85, "status": "success"},
        "lpr": {"num_plates_evaluated": 5},
    }
    output_path.write_text(json.dumps(existing))

    with (
        patch("src.preprocessing.preprocess") as mock_preprocess,
        patch("src.detector.detect_violations") as mock_detect,
        patch("src.lpr.read_plate") as mock_read,
        patch("src.llm_classifier.evaluate_image_level_violations") as mock_llm,
        patch("src.evidence.package_evidence", side_effect=_mock_package_evidence),
        patch("src.evidence.annotate_image") as mock_annotate,
    ):
        import numpy as np

        dummy_img = np.zeros((200, 200, 3), dtype=np.uint8)
        mock_preprocess.return_value = (dummy_img, [])
        mock_detect.return_value = []
        mock_read.return_value = {
            "text": "KA-01-AB-1234",
            "confidence": 0.95,
            "valid": True,
            "raw": "KA-01-AB-1234",
        }
        mock_llm.return_value = []
        mock_annotate.return_value = dummy_img

        benchmark_pipeline(image_dir=str(tmp_path), output_path=str(output_path))

    saved = json.loads(output_path.read_text())
    assert saved["detector"]["mAP50"] == 0.85
    assert saved["lpr"]["num_plates_evaluated"] == 5
    assert "benchmark" in saved
    assert saved["benchmark"]["status"] == "success"


def test_benchmark_pipeline_skips_bad_images(tmp_path):
    """Test that an image that cannot be read is skipped, not fatal."""
    from src.evaluate import benchmark_pipeline

    _make_test_image(tmp_path, "good.jpg")
    # Create an invalid file that cv2 will return None for
    bad_path = tmp_path / "bad.jpg"
    bad_path.write_text("not an image")

    output_path = tmp_path / "metrics.json"

    with (
        patch("src.preprocessing.preprocess") as mock_preprocess,
        patch("src.detector.detect_violations") as mock_detect,
        patch("src.lpr.read_plate") as mock_read,
        patch("src.llm_classifier.evaluate_image_level_violations") as mock_llm,
        patch("src.evidence.package_evidence", side_effect=_mock_package_evidence),
        patch("src.evidence.annotate_image") as mock_annotate,
    ):
        import numpy as np

        dummy_img = np.zeros((200, 200, 3), dtype=np.uint8)
        mock_preprocess.return_value = (dummy_img, [])
        mock_detect.return_value = []
        mock_read.return_value = {
            "text": "KA-01-AB-1234",
            "confidence": 0.95,
            "valid": True,
            "raw": "KA-01-AB-1234",
        }
        mock_llm.return_value = []
        mock_annotate.return_value = dummy_img

        result = benchmark_pipeline(image_dir=str(tmp_path), output_path=str(output_path))

    assert result["benchmark"]["status"] == "success"
    assert result["benchmark"]["num_images"] == 1
    assert result["benchmark"]["num_skipped"] >= 0


def test_benchmark_pipeline_llm_disabled(tmp_path):
    """Test that skip_llm=True results in llm_ms = 0.0 for all images."""
    from src.evaluate import benchmark_pipeline

    _make_test_image(tmp_path, "img1.jpg")

    output_path = tmp_path / "metrics.json"

    with (
        patch("src.preprocessing.preprocess") as mock_preprocess,
        patch("src.detector.detect_violations") as mock_detect,
        patch("src.lpr.read_plate") as mock_read,
        patch("src.llm_classifier.evaluate_image_level_violations") as mock_llm,
        patch("src.evidence.package_evidence", side_effect=_mock_package_evidence),
        patch("src.evidence.annotate_image") as mock_annotate,
    ):
        import numpy as np

        dummy_img = np.zeros((200, 200, 3), dtype=np.uint8)
        mock_preprocess.return_value = (dummy_img, [])
        mock_detect.return_value = []
        mock_read.return_value = {
            "text": "KA-01-AB-1234",
            "confidence": 0.95,
            "valid": True,
            "raw": "KA-01-AB-1234",
        }
        mock_annotate.return_value = dummy_img

        result = benchmark_pipeline(
            image_dir=str(tmp_path), output_path=str(output_path), skip_llm=True
        )

    assert result["benchmark"]["status"] == "success"
    # When skip_llm=True, evaluate_image_level_violations is never called
    mock_llm.assert_not_called()
    for entry in result["benchmark"]["per_image"]:
        assert entry["stages"]["llm_ms"] == 0.0
    assert result["benchmark"]["per_stage_timing"]["llm_ms"]["mean"] == 0.0
    assert result["benchmark"]["per_stage_timing"]["llm_ms"]["max"] == 0.0
