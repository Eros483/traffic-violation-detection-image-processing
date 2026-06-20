# ----- yolov8 pose occupant counting @ src/triple_riding.py -----

import os

import numpy as np
from ultralytics import YOLO

from utils.config import config
from utils.logger import logger

_pose_model = None


def _get_pose_model():
    global _pose_model
    if _pose_model is not None:
        return _pose_model
    pose_model_path = config.get_yaml("models.pose.weights", "artifacts/yolov8n-pose.pt")
    if not os.path.exists(pose_model_path):
        logger.warning(f"Pose model weights not found at {pose_model_path}")
        _pose_model = False
        return None
    try:
        _pose_model = YOLO(pose_model_path)
        logger.info(f"Loaded pose model from {pose_model_path}")
    except Exception as e:
        logger.error(f"Failed to load pose model {pose_model_path}: {e}")
        _pose_model = False
    return _pose_model if _pose_model is not False else None


def count_riders(image: np.ndarray, vehicle_bbox: list[int]) -> int:
    """
    Takes a vehicle bounding box, pads it, and runs YOLO pose estimation
    to count the number of occupants.
    """
    model = _get_pose_model()
    if model is None:
        return 0

    x1, y1, x2, y2 = vehicle_bbox
    pad = config.get_yaml("detection.vehicle_pad_ratio", 0.3)
    h, w = image.shape[:2]

    # Calculate padded coordinates, bounded by image dimensions
    cx1 = max(0, int(x1 - (x2 - x1) * pad))
    cy1 = max(0, int(y1 - (y2 - y1) * pad))
    cx2 = min(w, int(x2 + (x2 - x1) * pad))
    cy2 = min(h, int(y2 + (y2 - y1) * pad))

    crop = image[cy1:cy2, cx1:cx2]

    # Safety check for invalid crops
    if crop.size == 0:
        return 0

    results = model(crop, verbose=False)

    # Count the number of detected persons (boxes)
    person_count = len(results[0].boxes) if results[0].boxes is not None else 0
    return person_count
