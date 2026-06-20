# ----- crud endpoints for violations @ api/routes/violations.py -----

import base64
import io
import json
import uuid
from pathlib import Path

import cv2
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from api.schemas import PaginatedViolations, ProcessRequest, ProcessResponse

router = APIRouter()
DATA_FILE = Path("outputs/violations.jsonl")


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


@router.get("", response_model=PaginatedViolations)
def get_violations(page: int = 1, page_size: int = 10):
    """Returns a paginated list of all processed traffic violations."""
    items = _load_all_records()

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size

    return PaginatedViolations(items=items[start_idx:end_idx], total=len(items), page=page)


@router.get("/{violation_id}")
def get_violation(violation_id: str):
    """Returns a single violation record by its violation_id (UUID)."""
    items = _load_all_records()
    for item in items:
        if item.get("violation_id") == violation_id:
            return item
    raise HTTPException(status_code=404, detail="Violation not found")


@router.post("/process", response_model=ProcessResponse)
def process_image(request: ProcessRequest):
    """Accepts an image path, runs the full detection pipeline, and returns violation records."""
    from src.pipeline import process_image as run_pipeline

    result = run_pipeline(request.image_path)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Failed to process image. Ensure the file exists and is a valid image.",
        )

    return ProcessResponse(
        records=result["records"],
        preprocess_steps=result["preprocess_steps"],
    )


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Accepts an uploaded image, runs the detection pipeline, and returns results with annotated image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    file_id = str(uuid.uuid4())
    upload_dir = Path("public/outputs/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    input_path = upload_dir / f"{file_id}.jpg"
    contents = await file.read()
    with open(input_path, "wb") as f:
        f.write(contents)

    from src.pipeline import process_image as run_pipeline

    result = run_pipeline(str(input_path))
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Failed to process image. Ensure the file is a valid traffic image.",
        )

    annotated_path = upload_dir / f"{file_id}_annotated.jpg"
    cv2.imwrite(str(annotated_path), result["annotated_image"])

    with open(annotated_path, "rb") as f:
        annotated_b64 = base64.b64encode(f.read()).decode("utf-8")

    return JSONResponse(
        content={
            "records": result["records"],
            "annotated_image_b64": annotated_b64,
            "preprocess_steps": result["preprocess_steps"],
        }
    )
