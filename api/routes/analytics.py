# ----- aggregated stats and charts @ api/routes/analytics.py -----

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from api.schemas import AnalyticsSummary

router = APIRouter()
DATA_FILE = Path("outputs/violations.jsonl")
METRICS_FILE = Path("outputs/metrics.json")


@router.get("/summary", response_model=AnalyticsSummary)
def get_summary():
    """Returns total counts and high-level analytics."""
    total_count = 0

    if DATA_FILE.exists():
        with open(DATA_FILE, "r") as f:
            total_count = sum(1 for line in f if line.strip())

    return AnalyticsSummary(total_violations=total_count)


@router.get("/metrics")
def get_metrics():
    """Returns model performance metrics (mAP, precision, recall) from outputs/metrics.json."""
    if not METRICS_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Metrics not found. Run 'make evaluate' after placing the trained model.",
        )

    with open(METRICS_FILE, "r") as f:
        return json.load(f)
