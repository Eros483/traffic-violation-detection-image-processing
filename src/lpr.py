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


def format_plate(text: str) -> str:
    """Formats raw alphanumeric string into standard XX-00-XX-0000 format."""
    clean_text = re.sub(r"[^A-Z0-9]", "", text.upper())
    if len(clean_text) >= 10:
        return f"{clean_text[:2]}-{clean_text[2:4]}-{clean_text[4:6]}-{clean_text[6:]}"
    return clean_text


def validate_and_correct(raw_text: str) -> tuple[str, bool]:
    """
    Checks if text matches KA format. Uses block-positional character
    replacements to fix common OCR confusions.
    """
    text = raw_text.upper().replace(" ", "").replace("-", "")

    if KA_REGEX.match(text):
        return format_plate(text), True

    # Smart block correction based on expected KA format
    num_fixes = {"O": "0", "I": "1", "B": "8", "S": "5", "Z": "2", "G": "6"}
    alpha_fixes = {"0": "O", "1": "I", "8": "B", "5": "S", "2": "Z", "6": "G"}

    if len(text) >= 9:
        chars = list(text)
        
        # KA part (0-2) should be letters
        for i in range(min(2, len(chars))):
            if chars[i] in alpha_fixes: chars[i] = alpha_fixes[chars[i]]
            
        # District part (2-4) should be numbers
        for i in range(2, min(4, len(chars))):
            if chars[i] in num_fixes: chars[i] = num_fixes[chars[i]]
            
        # End sequence (last 4) should be numbers
        for i in range(max(4, len(chars)-4), len(chars)):
            if chars[i] in num_fixes: chars[i] = num_fixes[chars[i]]
            
        # Middle series should be letters
        for i in range(4, max(4, len(chars)-4)):
            if chars[i] in alpha_fixes: chars[i] = alpha_fixes[chars[i]]
            
        candidate = "".join(chars)
        if KA_REGEX.match(candidate):
            return format_plate(candidate), True

    return text, False


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

    raw_text = " ".join([line[1][0] for line in results[0]])
    confidence = min([line[1][1] for line in results[0]])

    corrected_text, is_valid = validate_and_correct(raw_text)

    return {
        "text": corrected_text,
        "confidence": float(confidence),
        "valid": is_valid,
        "raw": raw_text,
    }