# ----- tests for optional llm reasoning @ tests/test_src/test_llm_classifier.py -----

from unittest.mock import patch

from src.llm_classifier import evaluate_image_level_violations
from utils.config import config


def test_evaluate_returns_empty_when_disabled():
    """Test that the LLM module safely skips processing if disabled in config."""
    # Temporarily patch the settings to ensure it acts as disabled
    config.yaml_config["llm_violations"] = {"enabled": False}
    
    result = evaluate_image_level_violations("dummy_path.jpg")
    
    assert result == []
    assert isinstance(result, list)