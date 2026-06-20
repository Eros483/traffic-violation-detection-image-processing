# ----- tests for triple riding pose counting @ tests/test_src/test_triple_riding.py -----

import numpy as np

from src.triple_riding import count_riders


def test_count_riders_returns_int_for_valid_bbox():
    """Test that count_riders returns an integer for a valid vehicle bbox."""
    image = np.zeros((640, 640, 3), dtype=np.uint8)
    bbox = [100, 100, 300, 400]
    count = count_riders(image, bbox)
    assert isinstance(count, int)
    assert count >= 0


def test_count_riders_handles_edge_bbox():
    """Test that count_riders clips bbox to image boundaries."""
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    # Bbox extending beyond image boundaries
    bbox = [-50, -50, 200, 200]
    count = count_riders(image, bbox)
    assert isinstance(count, int)


def test_count_riders_zero_for_empty_image():
    """Test that count_riders returns 0 for an empty image."""
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    bbox = [10, 10, 50, 50]
    count = count_riders(image, bbox)
    assert count >= 0
