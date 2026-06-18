# ----- tests for image preprocessing @ tests/test_src/test_preprocessing.py -----

import numpy as np

from src.preprocessing import preprocess


def test_preprocess_applies_clahe_to_dark_image(dark_image):
    """Test that low-light images trigger the CLAHE enhancement step."""
    processed, steps = preprocess(dark_image)

    assert "clahe_enhancement" in steps
    assert isinstance(processed, np.ndarray)
    assert processed.shape == dark_image.shape


def test_preprocess_skips_clahe_for_normal_image(normal_image):
    """Test that normally lit images do not trigger CLAHE."""
    processed, steps = preprocess(normal_image)

    assert "clahe_enhancement" not in steps
    assert isinstance(processed, np.ndarray)
