# ----- shared pytest fixtures @ tests/conftest.py -----

import numpy as np
import pytest


@pytest.fixture
def dummy_image():
    """Returns a dummy 640x640 RGB image (numpy array)."""
    return np.zeros((640, 640, 3), dtype=np.uint8)


@pytest.fixture
def dark_image():
    """Returns a dummy low-light image to trigger CLAHE."""
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    img[:] = 30  # Low luminance
    return img


@pytest.fixture
def normal_image():
    """Returns a dummy normal-light image."""
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    img[:] = 120  # Normal luminance
    return img
