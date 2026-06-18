# ----- evidence packaging, hashing, and cv2 annotation @ src/evidence.py -----

import hashlib
import uuid
from dataclasses import dataclass
from datetime import datetime

import cv2
import numpy as np

from utils.logger import logger


@dataclass
class ViolationRecord:
    violation_id: str
    timestamp: str
    image_path: str
    image_hash: str
    vehicle_bbox: list[int]
    vehicle_type: str
    plate_number: str | None
    plate_confidence: float | None
    violations: list[dict]
    severity: str
    legal_sections: list[str]


LEGAL_MAP = {
    "helmet": "MV Act S129",
    "triple_riding": "MV Act S128",
    "mobile_phone": "MV Act S184",
    "red_light": "MV Act S184",
    "wrong_side_driving": "MV Act S184",
}


def package_evidence(image_path: str, detections: list[dict]) -> list[ViolationRecord]:
    """Transforms raw detector outputs into standard evidence records with hashes."""
    records = []
    try:
        with open(image_path, "rb") as f:
            image_hash = hashlib.sha256(f.read()).hexdigest()
    except Exception as e:
        logger.error(f"Failed to generate hash for {image_path}: {e}")
        image_hash = "unknown"

    for det in detections:
        # Determine severity
        is_high_severity = any(
            v.get("type") in ["red_light", "wrong_side_driving"] for v in det["violations"]
        )

        record = ViolationRecord(
            violation_id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            image_path=image_path,
            image_hash=image_hash,
            vehicle_bbox=det["bbox"],
            vehicle_type=det["vehicle_type"],
            plate_number=det.get("plate_text"),
            plate_confidence=det.get("plate_confidence"),
            violations=det["violations"],
            severity="high" if is_high_severity else "standard",
            legal_sections=[LEGAL_MAP.get(v.get("type"), "Unknown") for v in det["violations"]],
        )
        records.append(record)

    return records


def annotate_image(image: np.ndarray, records: list[ViolationRecord]) -> np.ndarray:
    """Draws bounding boxes, plates, and violation labels onto the image."""
    img = image.copy()

    for rec in records:
        if not rec.vehicle_bbox:
            continue

        x1, y1, x2, y2 = rec.vehicle_bbox
        color = (
            (0, 0, 255) if rec.severity == "high" else (0, 165, 255)
        )  # Red for high, Orange for standard

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

        # Draw violation texts above box
        for i, v in enumerate(rec.violations):
            label = f"{v['type']} ({v.get('confidence', 0.0):.2f})"
            y_offset = y1 - 10 - (i * 20)
            cv2.putText(
                img, label, (x1, max(20, y_offset)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2
            )

        # Draw plate below box
        if rec.plate_number:
            cv2.putText(
                img,
                rec.plate_number,
                (x1, y2 + 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 0),
                2,
            )

    return img
