# ----- standalone llm violation checker @ scripts/check_llm.py -----
# Usage: uv run python scripts/check_llm.py <image_path>

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.llm_classifier import evaluate_image_level_violations


def main():
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/check_llm.py <image_path>")
        print("   eg: uv run python scripts/check_llm.py public/img_001.jpg")
        sys.exit(1)

    image_path = sys.argv[1]

    print(f"Checking LLM violations for: {image_path}")
    violations = evaluate_image_level_violations(image_path)

    if not violations:
        print("\nNo violations detected by LLM.")
    else:
        print(f"\n{len(violations)} violation(s) detected:")
        for v in violations:
            print(f"  - {v.get('type', 'unknown')}")
            print(f"    confidence: {v.get('confidence', 'N/A')}")
            print(f"    description: {v.get('description', 'N/A')}")

    print(f"\nRaw output:\n{json.dumps(violations, indent=2)}")


if __name__ == "__main__":
    main()
