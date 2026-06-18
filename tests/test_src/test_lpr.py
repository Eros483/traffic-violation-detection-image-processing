# ----- tests for lpr validation logic @ tests/test_src/test_lpr.py -----

from src.lpr import format_plate, validate_and_correct


def test_format_plate():
    """Test that valid alphanumeric strings get formatted correctly."""
    assert format_plate("KA01AB1234") == "KA-01-AB-1234"
    # Too short for full formatting, should just return cleaned text
    assert format_plate("KA01A123") == "KA01A123"


def test_validate_and_correct_valid_plate():
    """Test that a perfectly valid plate is recognized and formatted."""
    text, is_valid = validate_and_correct("KA-01-AB-1234")
    assert is_valid is True
    assert text == "KA-01-AB-1234"


def test_validate_and_correct_ocr_confusion():
    """Test that common OCR mistakes (O vs 0, I vs 1, S vs 5) are corrected."""
    # Contains 'O' instead of '0', 'I' instead of '1', 'S' instead of '5'
    raw_ocr = "KA-O1-AB-I23S"
    text, is_valid = validate_and_correct(raw_ocr)

    assert is_valid is True
    assert text == "KA-01-AB-1235"


def test_validate_and_correct_invalid_plate():
    """Test that out-of-state or malformed plates are rejected."""
    text, is_valid = validate_and_correct("DL-01-AB-1234")

    assert is_valid is False
    assert text == "DL01AB1234"  # Returns raw stripped text
