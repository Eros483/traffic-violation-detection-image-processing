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


class ProcessRequest(BaseModel):
    image_path: str


class ProcessResponse(BaseModel):
    records: list[dict]
    preprocess_steps: list[str]
