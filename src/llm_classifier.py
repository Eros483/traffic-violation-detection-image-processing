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

    prompt = (
        f"Analyze this traffic camera image. Specifically check for the following traffic violations: {', '.join(active_checks)}. "
        'Reply ONLY in valid JSON format. Example: {"violations": [{"type": "mobile_phone", "confidence": 0.85, "description": "Driver holding phone"}]}'
        ' If no violations are present, return {"violations": []}.'
    )

    try:
        base64_image = encode_image(image_path)
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                    ],
                }
            ],
            model=config.get_yaml("llm_violations.model", "llava-1.5-7b-4096"),
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = chat_completion.choices[0].message.content
        parsed = json.loads(content)
        
        return parsed.get("violations", [])

    except Exception as e:
        logger.error(f"LLM API call failed: {e}")
        return []