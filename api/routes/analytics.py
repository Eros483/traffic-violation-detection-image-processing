# ----- aggregated stats and charts @ api/routes/analytics.py -----

from pathlib import Path

from fastapi import APIRouter

from api.schemas import AnalyticsSummary

router = APIRouter()
DATA_FILE = Path("outputs/violations.jsonl")


@router.get("/summary", response_model=AnalyticsSummary)
def get_summary():
    """Returns total counts and high-level analytics."""
    total_count = 0
    
    if DATA_FILE.exists():
        with open(DATA_FILE, "r") as f:
            total_count = sum(1 for line in f if line.strip())

    return AnalyticsSummary(total_violations=total_count)