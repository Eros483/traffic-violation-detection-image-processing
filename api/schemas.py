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


class ChallanRequest(BaseModel):
    violation_id: str
    violations: list[dict]
    plate_number: str | None = None
    vehicle_type: str = "vehicle"
    location: str = "Bengaluru"
    image_hash: str = ""


class ChallanResponse(BaseModel):
    challan_id: str
    violation_id: str
    issued_at: str
    vehicle_type: str
    plate_number: str | None
    location: str
    violations: list[dict]
    legal_sections: list[str]
    fine_total: int
    status: str
    image_ref: str
    image_hash: str


class PaginatedChallans(BaseModel):
    items: list[dict]
    total: int
    page: int
