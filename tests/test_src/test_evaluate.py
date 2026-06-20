# ----- tests for evaluation script @ tests/test_src/test_evaluate.py -----

import json
import os
from unittest.mock import MagicMock, patch


def test_evaluate_script_generates_metrics():
    """Test that the evaluation script writes metrics.json without running real CV validation."""
    with patch("src.evaluate.YOLO") as mock_yolo:
        # Set up the mock YOLO object and its returned metrics
        mock_model_instance = MagicMock()
        mock_metrics = MagicMock()

        # Mocking the ultralytics results object structure
        mock_metrics.box.map50 = 0.85
        mock_metrics.box.mp = 0.80
        mock_metrics.box.mr = 0.90
        mock_model_instance.val.return_value = mock_metrics
        mock_yolo.return_value = mock_model_instance

        # Import and run the evaluation logic
        try:
            from src.evaluate import generate_metrics
        except ImportError:
            import pytest

            pytest.fail("src/evaluate.py has not been implemented yet!")

        # Use a temporary output path for testing
        test_output_path = "outputs/test_metrics.json"

        # Clean up before test if it exists from a prior failed run
        if os.path.exists(test_output_path):
            os.remove(test_output_path)

        generate_metrics(output_path=test_output_path)

        # Assertions
        assert os.path.exists(test_output_path)

        with open(test_output_path, "r") as f:
            data = json.load(f)

        assert data["detector"]["mAP50"] == 0.85
        assert data["detector"]["precision"] == 0.80
        assert data["detector"]["recall"] == 0.90

        # Clean up
        os.remove(test_output_path)
