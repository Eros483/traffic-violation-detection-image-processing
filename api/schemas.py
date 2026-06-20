# ----- pydantic response models @ api/schemas.py -----

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class PaginatedViolations(BaseModel):
    items: list[dict]
    total: int
    page: int


class AnalyticsSummary(BaseModel):
    total_violations: int
