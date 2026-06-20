# ----- optional vision llm reasoning layer @ src/llm_classifier.py -----

import base64
import json
import os

from groq import Groq

from utils.config import config
from utils.logger import logger


def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def _normalize_violations(raw: list) -> list[dict]:
    """
    Validates and normalizes the LLM response into a flat list of violation dicts.
    Handles nested arrays, non-dict items, and missing fields gracefully.
    """
    result = []
    for item in raw:
        if isinstance(item, dict):
            result.append(item)
        elif isinstance(item, list):
            # Flatten nested arrays the model sometimes produces
            for sub in item:
                if isinstance(sub, dict):
                    result.append(sub)
    return result


def evaluate_image_level_violations(image_path: str) -> list[dict]:
    """
    Uses Groq vision LLM to check for complex violations.
    Returns a list of image-level violation dictionaries.
    """
    if not config.get_yaml("llm_violations.enabled", False):
        return []

    env_key = config.get_yaml("llm_violations.api_key_env", "GROQ_API_KEY")
    api_key = os.environ.get(env_key)
    if not api_key:
        logger.warning(f"LLM enabled but {env_key} is missing. Skipping LLM checks.")
        return []

    try:
        client = Groq(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        return []

    classifications = config.get_yaml("llm_violations.classifications", {})
    active_checks = [k for k, v in classifications.items() if v.get("enabled", False)]

    if not active_checks:
        return []

    checks_str = ", ".join(active_checks)
    prompt = (
        f"You are analyzing an Indian traffic camera image for the Bengaluru Traffic Challenge.\n"
        f"Check for these violations: {checks_str}.\n\n"
        f"Rules:\n"
        f"- Report a violation ONLY if you are confident it is present\n"
        f"- Only include violations with confidence > 0.5 — omit anything scored 0.5 or below\n"
        f"- seatbelt: only applies to cars and auto-rickshaws — NEVER report for motorcycles, scooters, or bicycles\n"
        f"- mobile_phone: only if the driver/rider is visibly holding a phone to their ear or looking at the screen\n"
        f"- wrong_side_driving: vehicle is clearly on the wrong side of the road\n"
        f"- red_light: vehicle is crossing an intersection against a clearly visible red signal\n"
        f"- stop_line: vehicle has crossed the stop line at a red light\n"
        f"- illegal_parking: vehicle is parked in a no-parking zone or on a footpath\n"
        f"- Confidence must be a float (e.g. 0.85), never a string\n\n"
        f"Respond ONLY with valid JSON using this exact array format:\n"
        f'{{"violations": [{{"type": "mobile_phone", "confidence": 0.85, "description": "Rider holding phone to ear"}}]}}\n\n'
        f'CORRECT (flat array): {{"violations": [{{"type": "seatbelt", "confidence": 0.9, "description": "Car driver not wearing seatbelt"}}]}}\n'
        f'WRONG (nested array - DO NOT do this): {{"violations": [[{{"type": "seatbelt", "confidence": 0.9}}]]}}\n'
        f'No violations found: {{"violations": []}}'
    )

    try:
        base64_image = encode_image(image_path)

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                        },
                    ],
                }
            ],
            model=config.get_yaml("llm_violations.model", "llava-1.5-7b-4096"),
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = chat_completion.choices[0].message.content
        parsed = json.loads(content)

        raw = parsed.get("violations", [])
        violations = _normalize_violations(raw)
        return [
            v
            for v in violations
            if isinstance(v.get("confidence"), (int, float)) and v["confidence"] > 0.5
        ]

    except Exception as e:
        logger.error(f"LLM API call failed: {e}")
        return []
