# ----- clahe enhancement and resizing @ src/preprocessing.py -----

import cv2
import numpy as np

from utils.logger import logger


def preprocess(image: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    Analyzes image luminance and applies CLAHE enhancement if the image is too dark.
    Returns the processed image and a list of applied preprocessing steps.
    """
    steps = []
    try:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        mean_lum = lab[:, :, 0].mean()

        if mean_lum < 60:
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            steps.append("clahe_enhancement")
            logger.info(f"Applied CLAHE enhancement. Mean luminance was {mean_lum:.2f}")

    except Exception as e:
        logger.error(f"Preprocessing failed: {e}")

    return image, steps