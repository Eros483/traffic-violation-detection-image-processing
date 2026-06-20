export type Severity = "high" | "standard";
export type VehicleType = "two_wheeler" | "vehicle" | "unknown";

/** Canonical violation type keys emitted by the backend. */
export type ViolationType =
  | "helmet"
  | "triple_riding"
  | "mobile_phone"
  | "red_light"
  | "wrong_side"
  | "wrong_side_driving"
  | "parking"
  | "illegal_parking"
  | "seatbelt"
  | "stop_line";

export interface Violation {
  type: ViolationType | string;
  confidence: number; // detection confidence, 0..1
  description?: string;
}

/** One line of outputs/violations.jsonl (src/evidence.py :: ViolationRecord). */
export interface ViolationRecord {
  violation_id: string;
  timestamp: string; // ISO-8601
  image_path: string;
  image_hash: string;
  vehicle_bbox: [number, number, number, number] | null;
  vehicle_type: VehicleType | string;
  plate_number: string | null;
  plate_confidence: number | null; // 0.0 when plate unread
  violations: Violation[];
  severity: Severity;
  legal_sections: string[]; // e.g. "MV Act S129"
}

/** GET /api/violations */
export interface PaginatedViolations {
  items: ViolationRecord[];
  total: number;
  page: number;
}

/** GET /api/analytics/summary */
export interface AnalyticsSummary {
  total_violations: number;
}

/** GET /api/analytics/metrics (outputs/metrics.json). */
export interface ModelMetrics {
  detector?: {
    mAP50?: number;
    mAP50_95?: number;
    precision?: number;
    recall?: number;
  };
  status?: string;
  message?: string;
  /** F012 benchmark — populated by `make benchmark`. */
  benchmark?: {
    per_stage_timing: {
      total_ms: { mean: number; std: number; min: number; max: number; total: number };
    };
    throughput_images_per_sec: number;
    num_images: number;
    peak_memory_mb: number | null;
  };
}

/** One line of outputs/challans.jsonl (api/schemas.py :: ChallanResponse). */
export interface ChallanRecord {
  challan_id: string;
  violation_id: string;
  issued_at: string;
  vehicle_type: string;
  plate_number: string | null;
  location: string;
  violations: { type: string; confidence?: number }[];
  legal_sections: string[];
  fine_total: number;
  status: string;
  image_ref: string;
  image_hash: string;
}

export interface PaginatedChallans {
  items: ChallanRecord[];
  total: number;
  page: number;
}

/** POST /api/challans body (api/schemas.py :: ChallanRequest). */
export interface ChallanRequest {
  violation_id: string;
  violations: { type: string; confidence?: number }[];
  plate_number?: string | null;
  vehicle_type?: string;
  location?: string;
  image_hash?: string;
}

export interface HealthResponse {
  status: string;
}

/** Shape returned by POST /api/violations/upload. */
export interface UploadResult {
  records: ViolationRecord[];
  annotated_image_b64: string;
  preprocess_steps: string[];
}
