# ----- end to end orchestration pipeline @ src/pipeline.py -----

import json
import os

import cv2

from src.detector import detect_violations
from src.evidence import annotate_image, package_evidence
from src.llm_classifier import evaluate_image_level_violations
from src.lpr import read_plate
from src.preprocessing import preprocess
from utils.config import config
from utils.logger import logger


def process_image(image_path: str, skip_llm: bool = False) -> dict:
    """
    Runs the full violation detection pipeline on a single image.
    When skip_llm is True, the optional LLM reasoning layer is bypassed
    (useful for batch processing where per-image LLM calls are too slow/expensive).
    """
    logger.info(f"Processing image: {image_path}")
    image = cv2.imread(image_path)
    if image is None:
        logger.error(f"Could not read image at {image_path}")
        return {}

    # 1. Preprocess
    image, preprocess_steps = preprocess(image)

    # 2. CV Detections (Detector + Pose)
    detections = detect_violations(image)

    # 3. License Plate Recognition
    for det in detections:
        if det.get("plate_bbox"):
            x1, y1, x2, y2 = det["plate_bbox"]
            plate_crop = image[y1:y2, x1:x2]
            plate_result = read_plate(plate_crop)
            det["plate_text"] = plate_result["text"]
            det["plate_confidence"] = plate_result["confidence"]

    # 4. Optional LLM validations (Image-level reasoning)
    llm_violations = []
    if not skip_llm:
        llm_violations = evaluate_image_level_violations(image_path)
    if llm_violations:
        detections.append(
            {
                "bbox": None,
                "vehicle_type": "vehicle",
                "violations": llm_violations,
                "plate_bbox": None,
                "plate_text": None,
                "plate_confidence": None,
            }
        )

    # 5. Evidence Packaging
    records = package_evidence(image_path, detections)

    # 6. Annotation
    annotated = annotate_image(image, records)

    return {
        "records": [r.__dict__ for r in records],
        "annotated_image": annotated,
        "preprocess_steps": preprocess_steps,
    }


if __name__ == "__main__":
    import glob

    # Grab sample images from the master traffic violation test set
    images = sorted(glob.glob("data/raw/master_traffic_violation_dataset/test/images/*.jpg"))
    images = images[:50]  # Process 50 samples as per design docs

    out_dir = "data/sample_outputs"
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    all_records = []

    for img_path in images:
        result = process_image(img_path, skip_llm=True)
        if not result:
            continue

        base_name = os.path.basename(img_path)
        out_path = os.path.join(out_dir, base_name)
        cv2.imwrite(out_path, result["annotated_image"])

        all_records.extend(result["records"])

    # Persist JSONL records
    with open("outputs/violations.jsonl", "w") as f:
        for rec in all_records:
            f.write(json.dumps(rec) + "\n")

    logger.info(
        f"Pipeline complete. {len(images)} images processed. Records at outputs/violations.jsonl"
    )
