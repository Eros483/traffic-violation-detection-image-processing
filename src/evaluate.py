# ----- model evaluation and metrics generation @ src/evaluate.py -----

import json
import os
from pathlib import Path

from ultralytics import YOLO

from utils.config import config
from utils.logger import logger


def generate_metrics(output_path: str = "outputs/metrics.json") -> None:
    """
    Loads the YOLO detector, runs validation on the test dataset split,
    and saves the precision/recall metrics to a JSON file.
    Requires the trained model to be present at the configured path.
    """
    detector_path = config.get_yaml("models.detector.weights", "artifacts/best.pt")

    if not os.path.exists(detector_path):
        logger.error(f"Trained model not found at {detector_path}. Cannot evaluate.")
        results = {
            "status": "error",
            "message": "Model weights not found. Download via 'make download-model'.",
        }
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=4)
        return

    try:
        model = YOLO(detector_path)
        logger.info("Running evaluation on test set. This may take a few minutes...")

        dataset_yaml = "data/raw/master_traffic_violation_dataset/data.yaml"

        if not os.path.exists(dataset_yaml):
            logger.error(f"Dataset configuration not found at {dataset_yaml}.")
            results = {
                "status": "error",
                "message": f"Dataset YAML not found at {dataset_yaml}.",
            }
        else:
            metrics = model.val(data=dataset_yaml, split="test", verbose=False)
            results = {
                "detector": {
                    "mAP50": float(metrics.box.map50),
                    "mAP50_95": float(metrics.box.map),
                    "precision": float(metrics.box.mp),
                    "recall": float(metrics.box.mr),
                },
                "status": "success",
            }

    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        results = {"status": "error", "message": str(e)}

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=4)

    logger.info(f"Metrics successfully written to {output_path}")


# ----- LPR accuracy evaluation on DataCluster dataset -----

import xml.etree.ElementTree as ET

import cv2


def _edit_distance(s1: str, s2: str) -> int:
    """Levenshtein distance between two strings."""
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return dp[m][n]


def _normalize(text: str | None) -> str:
    """Strip non-alphanumeric characters and uppercase."""
    if text is None:
        return ""
    return "".join(c for c in text.upper() if c.isalnum())


def evaluate_lpr(
    annotations_dir: str = "data/raw/indian-plates/Annotations",
    images_dir: str = "data/raw/indian-plates/images",
    output_path: str = "outputs/metrics.json",
) -> None:
    """
    Evaluate LPR accuracy on the DataCluster Indian Number Plates dataset.
    Parses Pascal VOC XMLs containing ground-truth number_plate_text,
    crops each plate region, runs read_plate(), and computes character-level
    and full-plate accuracy metrics. Merges results into outputs/metrics.json
    under an 'lpr' key.
    """
    from src.lpr import read_plate

    ann_path = Path(annotations_dir)
    img_path = Path(images_dir)

    if not ann_path.exists():
        logger.error(f"Annotations directory not found: {ann_path}")
        return

    per_plate = []
    total_edit_dist = 0
    total_max_len = 0
    total_plates = 0
    correct_plates = 0

    for xml_file in sorted(ann_path.glob("*.xml")):
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
        except ET.ParseError as e:
            logger.warning(f"Skipping unparseable XML {xml_file}: {e}")
            continue

        filename = root.findtext("filename")
        if not filename:
            continue

        image_file = img_path / filename
        if not image_file.exists():
            logger.warning(f"Image not found: {image_file}")
            continue

        img = cv2.imread(str(image_file))
        if img is None:
            logger.warning(f"Failed to read image: {image_file}")
            continue

        for obj in root.findall("object"):
            gt_text = None
            for attr_elem in obj.findall(".//attribute"):
                name_el = attr_elem.find("name")
                value_el = attr_elem.find("value")
                if (
                    name_el is not None
                    and value_el is not None
                    and name_el.text
                    and "number_plate_text" in name_el.text
                ):
                    gt_text = value_el.text
                    break

            if gt_text is None:
                continue

            bbox = obj.find("bndbox")
            if bbox is None:
                continue

            try:
                xmin = int(float(bbox.findtext("xmin", "0")))
                ymin = int(float(bbox.findtext("ymin", "0")))
                xmax = int(float(bbox.findtext("xmax", "0")))
                ymax = int(float(bbox.findtext("ymax", "0")))
            except (ValueError, TypeError):
                continue

            crop = img[ymin:ymax, xmin:xmax]
            if crop.size == 0:
                continue

            ocr_result = read_plate(crop)
            ocr_text = ocr_result.get("text") or ""

            gt_norm = _normalize(gt_text)
            ocr_norm = _normalize(ocr_text)

            max_len = max(len(gt_norm), len(ocr_norm))
            if max_len > 0:
                ed = _edit_distance(gt_norm, ocr_norm)
                char_acc = 1.0 - (ed / max_len)
            else:
                ed = 0
                char_acc = 1.0

            full_match = gt_norm == ocr_norm
            total_plates += 1
            total_edit_dist += ed
            total_max_len += max_len
            if full_match:
                correct_plates += 1

            per_plate.append(
                {
                    "image": filename,
                    "ground_truth": gt_text,
                    "ocr_output": ocr_text,
                    "ocr_confidence": ocr_result.get("confidence", 0.0),
                    "ocr_valid": ocr_result.get("valid", False),
                    "character_accuracy": round(char_acc, 4),
                    "full_match": full_match,
                }
            )

    char_accuracy = 1.0 - (total_edit_dist / total_max_len) if total_max_len > 0 else 0.0
    plate_accuracy = correct_plates / total_plates if total_plates > 0 else 0.0

    lpr_metrics = {
        "lpr": {
            "num_plates_evaluated": total_plates,
            "num_images_with_gt": len({r["image"] for r in per_plate}),
            "character_accuracy": round(char_accuracy, 4),
            "full_plate_accuracy": round(plate_accuracy, 4),
            "per_plate_results": per_plate,
        }
    }

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    existing = {}
    try:
        with open(output_path) as f:
            existing = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    existing.update(lpr_metrics)

    with open(output_path, "w") as f:
        json.dump(existing, f, indent=4)

    logger.info(
        f"LPR evaluation: {total_plates} plates, "
        f"char_acc={char_accuracy:.2%}, plate_acc={plate_accuracy:.2%} "
        f"-> merged into {output_path}"
    )


if __name__ == "__main__":
    generate_metrics()
    evaluate_lpr()
