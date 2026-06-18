# ----- plate detection, ocr, and validation @ src/lpr.py -----

import re

import cv2
import numpy as np
from paddleocr import PaddleOCR

from utils.config import config
from utils.logger import logger

ocr_lang = config.get_yaml("models.ocr.lang", "en")
use_angle = config.get_yaml("models.ocr.use_angle_cls", True)

try:
    ocr = PaddleOCR(use_angle_cls=use_angle, lang=ocr_lang, show_log=False)
except Exception as e:
    logger.error(f"Failed to initialize PaddleOCR: {e}")
    ocr = None

KA_PATTERN = config.get_yaml("plate.ka_pattern", r"^KA\s?\d{2}\s?[A-Z]{1,3}\s?\d{1,4}$")
KA_REGEX = re.compile(KA_PATTERN, re.IGNORECASE)

OCR_CONFUSION = {"0": "O", "O": "0", "1": "I", "I": "1", "8": "B", "B": "8", "5": "S", "S": "5"}


def format_plate(text: str) -> str:
    """Formats raw alphanumeric string into standard XX-00-XX-0000 format."""
    clean_text = re.sub(r"[^A-Z0-9]", "", text.upper())
    if len(clean_text) >= 10:
        return f"{clean_text[:2]}-{clean_text[2:4]}-{clean_text[4:6]}-{clean_text[6:]}"
    return clean_text


def validate_and_correct(raw_text: str) -> tuple[str, bool]:
    """
    Checks if text matches KA format. If not, attempts to swap frequently
    confused OCR characters to see if a valid format emerges.
    """
    text = raw_text.upper().replace(" ", "").replace("-", "")

    if KA_REGEX.match(text):
        return format_plate(text), True

    # Try heuristic corrections
    for wrong, right in OCR_CONFUSION.items():
        candidate = text.replace(wrong, right)
        if KA_REGEX.match(candidate):
            return format_plate(candidate), True

    return raw_text, False


def read_plate(plate_crop: np.ndarray) -> dict:
    """Runs PaddleOCR on a cropped plate image and validates the text."""
    if ocr is None or plate_crop.size == 0:
        return {"text": None, "confidence": 0.0, "valid": False, "raw": None}

    h, w = plate_crop.shape[:2]
    min_width = config.get_yaml("plate.min_crop_width", 100)
    upscale = config.get_yaml("plate.upscale_factor", 3)

    if w < min_width:
        plate_crop = cv2.resize(plate_crop, (w * upscale, h * upscale), interpolation=cv2.INTER_CUBIC)

    results = ocr.ocr(plate_crop, cls=True)

    if not results or not results[0]:
        return {"text": None, "confidence": 0.0, "valid": False, "raw": None}

    # Extract text and lowest confidence from all lines
    raw_text = " ".join([line[1][0] for line in results[0]])
    confidence = min([line[1][1] for line in results[0]])

    corrected_text, is_valid = validate_and_correct(raw_text)

    return {
        "text": corrected_text,
        "confidence": float(confidence),
        "valid": is_valid,
        "raw": raw_text,
    }