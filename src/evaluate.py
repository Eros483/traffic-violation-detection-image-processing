# ----- model evaluation and metrics generation @ src/evaluate.py -----

import json
import os

from ultralytics import YOLO

from utils.config import config
from utils.logger import logger


def generate_metrics(output_path: str = "outputs/metrics.json") -> None:
    """
    Loads the YOLO detector, runs validation on the test dataset split,
    and saves the precision/recall metrics to a JSON file.
    """
    detector_path = config.get_yaml(
        "models.detector.weights", "models/weights/traffic_violations/best.pt"
    )

    if not os.path.exists(detector_path):
        logger.warning(
            f"Trained model not found at {detector_path}. Metrics will be inaccurate using fallback."
        )
        detector_path = config.get_yaml("models.detector.fallback_weights", "yolov8m.pt")

    try:
        model = YOLO(detector_path)
        logger.info("Running evaluation on test set. This may take a few minutes...")

        # Assuming the dataset YAML path relative to the downloaded Kaggle data
        # If running locally, ensure data.yaml exists at this location
        dataset_yaml = "data/raw/data.yaml"

        if not os.path.exists(dataset_yaml):
            logger.error(
                f"Dataset configuration not found at {dataset_yaml}. Cannot run evaluation."
            )
            return

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


if __name__ == "__main__":
    generate_metrics()
