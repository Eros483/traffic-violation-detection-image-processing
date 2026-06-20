# ----- yolov8 vehicle, helmet, and plate detection @ src/detector.py -----

import math
import os

from ultralytics import YOLO

from src.triple_riding import count_riders
from utils.config import config
from utils.logger import logger

detector_path = config.get_yaml("models.detector.weights", "artifacts/best.pt")

model = None
if os.path.exists(detector_path):
    try:
        model = YOLO(detector_path)
        logger.info(f"Loaded detector from {detector_path}")
    except Exception as e:
        logger.error(f"Failed to load detector from {detector_path}: {e}")
        raise
else:
    logger.error(
        f"Detector weights not found at {detector_path}. "
        "Model must be placed at this path before running detection."
    )


def detect_violations(image) -> list[dict]:
    """
    Runs YOLO inference on the image. Maps detected classes to violations,
    invokes pose estimation for triple riding if configured, and associates
    license plates with the nearest vehicle/violation bounding box.

    The class mapping handles the master dataset labels:
      Plate (0) -> collected for association
      WithHelmet (1) -> no violation
      WithoutHelmet (2) -> helmet violation
      TripleRiding (3) -> triple_riding violation
    """
    if model is None:
        logger.warning("Detector not loaded. Skipping detection.")
        return []

    conf_thresh = config.get_yaml("models.detector.confidence_threshold", 0.5)
    img_size = config.get_yaml("models.detector.image_size", 640)
    results = model(image, conf=conf_thresh, imgsz=img_size, verbose=False)

    candidates = []
    plates = []

    if not results or not results[0].boxes:
        return candidates

    boxes = results[0].boxes
    names = results[0].names

    # First pass: separate plates from violation candidates
    for box in boxes:
        cls_id = int(box.cls[0])
        cls_name = names[cls_id].lower()
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        if "plate" in cls_name:
            plates.append({"bbox": [x1, y1, x2, y2], "confidence": confidence})
        else:
            violations = []
            if "without" in cls_name and "helmet" in cls_name:
                violations.append(
                    {
                        "type": "helmet",
                        "confidence": confidence,
                        "description": "Rider without helmet detected",
                    }
                )
            elif "triple" in cls_name:
                violations.append(
                    {
                        "type": "triple_riding",
                        "confidence": confidence,
                        "description": "Triple riding detected directly via CV",
                    }
                )

            # YOLO-Pose occupant counting for generic vehicle detections
            if not violations and cls_name in ["motorcycle", "two_wheeler", "vehicle"]:
                riders = count_riders(image, [x1, y1, x2, y2])
                triple_threshold = config.get_yaml("detection.triple_riding_threshold", 3)
                if riders >= triple_threshold:
                    violations.append(
                        {
                            "type": "triple_riding",
                            "confidence": 0.8,
                            "description": f"Pose estimation counted {riders} riders",
                        }
                    )

            if violations:
                candidates.append(
                    {
                        "bbox": [x1, y1, x2, y2],
                        "vehicle_type": (
                            "two_wheeler"
                            if "helmet" in cls_name or "triple" in cls_name
                            else "vehicle"
                        ),
                        "violations": violations,
                        "plate_bbox": None,
                        "plate_text": None,
                        "plate_confidence": None,
                    }
                )

    # Second pass: Associate nearest plate to each candidate
    for candidate in candidates:
        cx = (candidate["bbox"][0] + candidate["bbox"][2]) / 2
        cy = (candidate["bbox"][1] + candidate["bbox"][3]) / 2

        best_plate = None
        min_dist = float("inf")

        for plate in plates:
            pcx = (plate["bbox"][0] + plate["bbox"][2]) / 2
            pcy = (plate["bbox"][1] + plate["bbox"][3]) / 2
            dist = math.hypot(cx - pcx, cy - pcy)

            # Plate must be relatively close to the vehicle bbox
            if dist < min_dist and dist < (candidate["bbox"][3] - candidate["bbox"][1]) * 1.5:
                min_dist = dist
                best_plate = plate

        if best_plate:
            candidate["plate_bbox"] = best_plate["bbox"]

    return candidates
