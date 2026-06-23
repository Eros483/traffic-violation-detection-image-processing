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


# YouTube-related schemas


class YouTubeFrameRequest(BaseModel):
    youtube_url: str
    timestamp: float = 0.0
    quality: str = "high"
    start_time: float | None = None
    end_time: float | None = None


class YouTubeFrameResult(BaseModel):
    frame_path: str
    timestamp: float
    duration: float
    file_size: int
    extraction_method: str
    video_id: str
    resolution: str
    format: str


class YouTubeFrameResponse(BaseModel):
    records: list[dict]
    preprocess_steps: list[str]
    frame_result: YouTubeFrameResult
    annotated_image_b64: str = ""


class YouTubeCaptureRequest(BaseModel):
    youtube_url: str
    interval: int = 30
    start_time: int = 0
    end_time: int | None = None
    max_frames: int = 100


class YouTubeCaptureResult(BaseModel):
    frames: list[YouTubeFrameResult]
    total_frames: int
    processing_time: float
