# ----- tests for evaluation script @ tests/test_src/test_evaluate.py -----

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
