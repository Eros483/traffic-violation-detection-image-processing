# ----- tests for end-to-end pipeline @ tests/test_src/test_pipeline.py -----

from unittest.mock import patch

import cv2
import numpy as np


def test_process_image_success(tmp_path):
    """
    Tests the orchestration flow of the pipeline.
    This should fail until src/pipeline.py is implemented!
    """
    # Create a dummy image file on disk
    img_path = tmp_path / "test.jpg"
    cv2.imwrite(str(img_path), np.zeros((100, 100, 3), dtype=np.uint8))

    # Mock the heavy modules so we only test the orchestration logic
    with (
        patch("src.pipeline.preprocess") as mock_prep,
        patch("src.pipeline.detect_violations") as mock_det,
        patch("src.pipeline.package_evidence") as mock_ev,
        patch("src.pipeline.annotate_image") as mock_ann,
    ):

        mock_prep.return_value = (np.zeros((100, 100, 3)), ["clahe"])
        mock_det.return_value = []
        mock_ev.return_value = []
        mock_ann.return_value = np.zeros((100, 100, 3))

        # Attempt to import and run the pipeline
        try:
            from src.pipeline import process_image
        except ImportError:
            import pytest

            pytest.fail("src/pipeline.py has not been implemented yet!")

        result = process_image(str(img_path))

        assert "records" in result
        assert "annotated_image" in result
        assert "preprocess_steps" in result

        # Verify our orchestrator called the underlying steps
        mock_prep.assert_called_once()
        mock_det.assert_called_once()
        mock_ev.assert_called_once()
        mock_ann.assert_called_once()
