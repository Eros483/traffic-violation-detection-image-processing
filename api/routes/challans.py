# ----- challan crud endpoints @ api/routes/challans.py -----

import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException

from api.schemas import ChallanRequest, ChallanResponse, PaginatedChallans

router = APIRouter()
DATA_FILE = Path("outputs/challans.jsonl")
VIOLATIONS_FILE = Path("outputs/violations.jsonl")

FINE_MAP = {
    "helmet": 1000,
    "triple_riding": 1000,
    "mobile_phone": 5000,
    "red_light": 5000,
    "wrong_side": 1000,
    "wrong_side_driving": 1000,
    "parking": 500,
    "illegal_parking": 500,
    "seatbelt": 1000,
    "stop_line": 5000,
}

LEGAL_SECTION_MAP = {
    "helmet": "MV Act Section 129",
    "triple_riding": "MV Act Section 128",
    "mobile_phone": "MV Act Section 184",
    "red_light": "MV Act Section 119/177",
    "wrong_side": "MV Act Section 119",
    "wrong_side_driving": "MV Act Section 119",
    "parking": "MV Act Section 122",
    "illegal_parking": "MV Act Section 122",
    "seatbelt": "MV Act Section 194B",
    "stop_line": "MV Act Section 119/177",
}


def _load_all_challans() -> list[dict]:
    if not DATA_FILE.exists():
        return []
    records = []
    with open(DATA_FILE) as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records


def _save_challan(challan: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "a") as f:
        f.write(json.dumps(challan) + "\n")


@router.post("", response_model=ChallanResponse, status_code=201)
def create_challan(request: ChallanRequest):
    """Creates a challan from a violation record."""
    challan_id = str(uuid.uuid4())
    legal_sections = list(
        dict.fromkeys(
            LEGAL_SECTION_MAP.get(v.get("type", ""), "Unknown") for v in request.violations
        )
    )
    fine_total = sum(FINE_MAP.get(v.get("type", ""), 0) for v in request.violations)

    challan = {
        "challan_id": challan_id,
        "violation_id": request.violation_id,
        "issued_at": datetime.now().isoformat(),
        "vehicle_type": request.vehicle_type,
        "plate_number": request.plate_number,
        "location": request.location,
        "violations": request.violations,
        "legal_sections": legal_sections,
        "fine_total": fine_total,
        "status": "pending",
        "image_ref": f"public/outputs/{challan_id}.jpg",
        "image_hash": request.image_hash,
    }

    _save_challan(challan)
    return challan


@router.get("", response_model=PaginatedChallans)
def get_challans(page: int = 1, page_size: int = 10):
    """Returns a paginated list of all challans."""
    items = _load_all_challans()
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    return PaginatedChallans(items=items[start_idx:end_idx], total=len(items), page=page)


@router.get("/{challan_id}", response_model=ChallanResponse)
def get_challan(challan_id: str):
    """Returns a single challan by its challan_id (UUID)."""
    items = _load_all_challans()
    for item in items:
        if item.get("challan_id") == challan_id:
            return item
    raise HTTPException(status_code=404, detail="Challan not found")
