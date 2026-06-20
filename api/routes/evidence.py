# ----- evidence serving endpoints @ api/routes/evidence.py -----

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()
DATA_FILE = Path("outputs/violations.jsonl")
SAMPLE_OUTPUTS_DIR = Path("data/sample_outputs")


def _load_all_records() -> list[dict]:
    """Loads all violation records from the JSONL file."""
    if not DATA_FILE.exists():
        return []
    records = []
    with open(DATA_FILE) as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records


@router.get("/{violation_id}/image")
def get_evidence_image(violation_id: str):
    """Returns the annotated evidence image for a given violation ID."""
    records = _load_all_records()
    match = None
    for r in records:
        if r.get("violation_id") == violation_id:
            match = r
            break

    if match is None:
        raise HTTPException(status_code=404, detail="Violation not found")

    image_path = match.get("image_path", "")
    basename = Path(image_path).name
    annotated_path = SAMPLE_OUTPUTS_DIR / basename

    if not annotated_path.exists():
        raise HTTPException(status_code=404, detail="Annotated image not found")

    return FileResponse(str(annotated_path), media_type="image/jpeg")


@router.get("/{violation_id}/metadata")
def get_evidence_metadata(violation_id: str):
    """Returns the JSON metadata (including hash and legal sections) for a given violation ID."""
    records = _load_all_records()
    match = None
    for r in records:
        if r.get("violation_id") == violation_id:
            match = r
            break

    if match is None:
        raise HTTPException(status_code=404, detail="Violation not found")

    return match
