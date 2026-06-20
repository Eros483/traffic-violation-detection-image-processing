# ----- crud endpoints for violations @ api/routes/violations.py -----

import json
from pathlib import Path

from fastapi import APIRouter

from api.schemas import PaginatedViolations

router = APIRouter()
DATA_FILE = Path("outputs/violations.jsonl")


@router.get("", response_model=PaginatedViolations)
def get_violations(page: int = 1, page_size: int = 10):
    """Returns a paginated list of all processed traffic violations."""
    items = []

    if DATA_FILE.exists():
        with open(DATA_FILE, "r") as f:
            for line in f:
                if line.strip():
                    items.append(json.loads(line))

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size

    return PaginatedViolations(items=items[start_idx:end_idx], total=len(items), page=page)
