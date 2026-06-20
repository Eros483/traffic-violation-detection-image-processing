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


# ----- pipeline benchmark: timing, throughput, memory -----

import glob
import platform
import statistics
import time
from datetime import datetime

import cv2


def _describe_ram_gb() -> float | None:
    """Return total RAM in GB, or None if system info unavailable."""
    try:
        import psutil

        return round(psutil.virtual_memory().total / (1024**3), 1)
    except Exception:
        return None


def _peak_memory_mb() -> float | None:
    """Return current RSS in MB for this process, or None if unavailable."""
    try:
        import psutil

        return round(psutil.Process().memory_info().rss / (1024**2), 1)
    except Exception:
        return None


def _aggregate(values: list[float]) -> dict:
    """Compute mean, std, min, max, total for a list of floats."""
    if not values:
        return {"mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0, "total": 0.0}
    mean = statistics.mean(values)
    std = statistics.stdev(values) if len(values) > 1 else 0.0
    return {
        "mean": round(mean, 2),
        "std": round(std, 2),
        "min": round(min(values), 2),
        "max": round(max(values), 2),
        "total": round(sum(values), 2),
    }


def benchmark_pipeline(
    image_dir: str = "public",
    output_path: str = "outputs/metrics.json",
    skip_llm: bool = True,
    num_warmup: int = 0,
) -> dict:
    """
    Measure wall-clock time per pipeline stage, throughput, and per-stage memory
    on a set of sample images.

    Records RSS (resident set size) before and after every stage so you can
    see which component drives the ~700MB peak.  LLM calls are skipped by
    default (*skip_llm=True*) because Groq API latency dominates timing.

    Results are merged into *output_path* (typically outputs/metrics.json)
    under a ``"benchmark"`` key.
    """
    from src.detector import detect_violations
    from src.evidence import annotate_image, package_evidence
    from src.llm_classifier import evaluate_image_level_violations
    from src.lpr import read_plate
    from src.preprocessing import preprocess

    image_patterns = [os.path.join(image_dir, "*.jpg"), os.path.join(image_dir, "*.png")]
    image_paths = sorted(glob.glob(image_patterns[0]) + glob.glob(image_patterns[1]))

    if not image_paths:
        result = {
            "benchmark": {
                "status": "error",
                "message": f"No images found in {image_dir}/ (*.jpg, *.png).",
                "timestamp": datetime.now().isoformat(),
            }
        }
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        existing = _load_existing(output_path)
        existing.update(result)
        with open(output_path, "w") as f:
            json.dump(existing, f, indent=4)
        logger.warning(result["benchmark"]["message"])
        return result

    # --- warmup ---
    for i in range(num_warmup):
        idx = i % len(image_paths)
        warmup_img = cv2.imread(image_paths[idx])
        if warmup_img is not None:
            preprocess(warmup_img.copy())
            detect_violations(warmup_img.copy())

    # --- benchmark ---
    per_image = []
    all_preprocess_ms = []
    all_detect_ms = []
    all_ocr_ms = []
    all_llm_ms = []
    all_evidence_ms = []
    all_annotation_ms = []
    all_total_ms = []
    all_preprocess_mem = []
    all_detect_mem = []
    all_ocr_mem = []
    all_llm_mem = []
    all_evidence_mem = []
    all_annotation_mem = []
    total_start = time.perf_counter()
    peak_mem = 0.0
    num_skipped = 0

    for img_path in image_paths:
        image = cv2.imread(img_path)
        if image is None:
            logger.warning(f"Failed to read image: {img_path}")
            num_skipped += 1
            continue

        try:
            t0 = time.perf_counter()

            m0 = _peak_memory_mb()
            t_start = time.perf_counter()
            processed, _ = preprocess(image)
            t_end = time.perf_counter()
            m1 = _peak_memory_mb()
            preprocess_ms = (t_end - t_start) * 1000
            preprocess_mem_delta = (
                round((m1 - m0), 1) if (m0 is not None and m1 is not None) else None
            )

            t_start = time.perf_counter()
            detections = detect_violations(processed)
            t_end = time.perf_counter()
            m2 = _peak_memory_mb()
            detect_ms = (t_end - t_start) * 1000
            detect_mem_delta = round((m2 - m1), 1) if (m1 is not None and m2 is not None) else None

            t_start = time.perf_counter()
            ocr_total = 0.0
            for det in detections:
                if det.get("plate_bbox"):
                    x1, y1, x2, y2 = det["plate_bbox"]
                    plate_crop = processed[y1:y2, x1:x2]
                    t_ocr_start = time.perf_counter()
                    plate_result = read_plate(plate_crop)
                    t_ocr_end = time.perf_counter()
                    det["plate_text"] = plate_result["text"]
                    det["plate_confidence"] = plate_result["confidence"]
                    ocr_total += (t_ocr_end - t_ocr_start) * 1000
            m3 = _peak_memory_mb()
            ocr_ms = ocr_total
            ocr_mem_delta = round((m3 - m2), 1) if (m2 is not None and m3 is not None) else None

            image_path_str = str(img_path)
            t_start = time.perf_counter()
            llm_violations = []
            if not skip_llm:
                llm_violations = evaluate_image_level_violations(image_path_str)
            t_end = time.perf_counter()
            m4 = _peak_memory_mb()
            llm_ms = (t_end - t_start) * 1000
            llm_mem_delta = round((m4 - m3), 1) if (m3 is not None and m4 is not None) else None

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

            t_start = time.perf_counter()
            records = package_evidence(image_path_str, detections)
            t_end = time.perf_counter()
            m5 = _peak_memory_mb()
            evidence_ms = (t_end - t_start) * 1000
            evidence_mem_delta = (
                round((m5 - m4), 1) if (m4 is not None and m5 is not None) else None
            )

            t_start = time.perf_counter()
            annotate_image(processed, records)
            t_end = time.perf_counter()
            m6 = _peak_memory_mb()
            annotation_ms = (t_end - t_start) * 1000
            annotation_mem_delta = (
                round((m6 - m5), 1) if (m5 is not None and m6 is not None) else None
            )

            total_ms = (time.perf_counter() - t0) * 1000

            if m6 is not None and m6 > peak_mem:
                peak_mem = m6

            filename = os.path.basename(img_path)
            per_image_mem = {
                "preprocess_mb": {"start": m0, "end": m1, "delta": preprocess_mem_delta},
                "detect_mb": {"start": m1, "end": m2, "delta": detect_mem_delta},
                "ocr_mb": {"start": m2, "end": m3, "delta": ocr_mem_delta},
                "llm_mb": {"start": m3, "end": m4, "delta": llm_mem_delta},
                "evidence_mb": {"start": m4, "end": m5, "delta": evidence_mem_delta},
                "annotation_mb": {"start": m5, "end": m6, "delta": annotation_mem_delta},
            }

            per_image.append(
                {
                    "image": filename,
                    "total_ms": round(total_ms, 2),
                    "stages": {
                        "preprocess_ms": round(preprocess_ms, 2),
                        "detect_ms": round(detect_ms, 2),
                        "ocr_ms": round(ocr_ms, 2),
                        "llm_ms": round(llm_ms, 2),
                        "evidence_ms": round(evidence_ms, 2),
                        "annotation_ms": round(annotation_ms, 2),
                    },
                    "memory_mb": per_image_mem,
                }
            )
            all_preprocess_ms.append(preprocess_ms)
            all_detect_ms.append(detect_ms)
            all_ocr_ms.append(ocr_ms)
            all_llm_ms.append(llm_ms)
            all_evidence_ms.append(evidence_ms)
            all_annotation_ms.append(annotation_ms)
            all_total_ms.append(total_ms)

            if preprocess_mem_delta is not None:
                all_preprocess_mem.append(preprocess_mem_delta)
            if detect_mem_delta is not None:
                all_detect_mem.append(detect_mem_delta)
            if ocr_mem_delta is not None:
                all_ocr_mem.append(ocr_mem_delta)
            if llm_mem_delta is not None:
                all_llm_mem.append(llm_mem_delta)
            if evidence_mem_delta is not None:
                all_evidence_mem.append(evidence_mem_delta)
            if annotation_mem_delta is not None:
                all_annotation_mem.append(annotation_mem_delta)

        except Exception as e:
            logger.warning(f"Pipeline failed for {img_path}: {e}")
            num_skipped += 1
            continue

    total_elapsed = time.perf_counter() - total_start
    num_processed = len(per_image)

    def _mem_agg(values: list[float]) -> dict | None:
        if not values:
            return None
        return {
            "mean_delta_mb": round(statistics.mean(values), 1),
            "max_delta_mb": round(max(values), 1),
            "min_delta_mb": round(min(values), 1),
        }

    benchmark = {
        "status": "success",
        "num_images": num_processed,
        "num_skipped": num_skipped,
        "total_time_seconds": round(total_elapsed, 3),
        "throughput_images_per_sec": (
            round(num_processed / total_elapsed, 2) if total_elapsed > 0 else 0.0
        ),
        "peak_memory_mb": peak_mem if peak_mem > 0 else None,
        "timestamp": datetime.now().isoformat(),
        "per_stage_timing": {
            "preprocess_ms": _aggregate(all_preprocess_ms),
            "detect_ms": _aggregate(all_detect_ms),
            "ocr_ms": _aggregate(all_ocr_ms),
            "llm_ms": _aggregate(all_llm_ms),
            "evidence_ms": _aggregate(all_evidence_ms),
            "annotation_ms": _aggregate(all_annotation_ms),
            "total_ms": _aggregate(all_total_ms),
        },
        "per_stage_memory": {
            "preprocess_mb": _mem_agg(all_preprocess_mem),
            "detect_mb": _mem_agg(all_detect_mem),
            "ocr_mb": _mem_agg(all_ocr_mem),
            "llm_mb": _mem_agg(all_llm_mem),
            "evidence_mb": _mem_agg(all_evidence_mem),
            "annotation_mb": _mem_agg(all_annotation_mem),
        },
        "per_image": per_image,
        "hardware": {
            "cpu": platform.processor() or "unknown",
            "ram_gb": _describe_ram_gb(),
            "python_version": platform.python_version(),
        },
        "config": {
            "image_dir": image_dir,
            "skip_llm": skip_llm,
            "num_warmup": num_warmup,
        },
    }

    result = {"benchmark": benchmark}
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    existing = _load_existing(output_path)
    existing.update(result)
    with open(output_path, "w") as f:
        json.dump(existing, f, indent=4)

    logger.info(
        f"Benchmark complete: {num_processed} images in {total_elapsed:.2f}s "
        f"({num_processed / total_elapsed:.2f} img/s), "
        f"peak mem={peak_mem}MB, skipped={num_skipped}"
    )
    return result


def _load_existing(output_path: str) -> dict:
    """Load existing metrics.json content, returning empty dict if unavailable."""
    try:
        with open(output_path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


if __name__ == "__main__":
    generate_metrics()
    evaluate_lpr()
