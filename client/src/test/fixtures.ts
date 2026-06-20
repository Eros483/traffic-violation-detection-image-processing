import type { ViolationRecord } from "../types";

let seq = 0;

export function makeRecord(overrides: Partial<ViolationRecord> = {}): ViolationRecord {
  seq += 1;
  // Spread overrides last so explicit nulls (e.g. plate_number: null) are kept.
  return {
    violation_id: `vio-${seq}`,
    timestamp: "2026-06-20T10:00:00",
    image_path: `data/sample_outputs/img-${seq}.jpg`,
    image_hash: `hash-${seq}`,
    vehicle_bbox: [10, 10, 100, 100],
    vehicle_type: "two_wheeler",
    plate_number: "KA-01-AB-1234",
    plate_confidence: 0.9,
    violations: [{ type: "helmet", confidence: 0.92, description: "No helmet" }],
    severity: "standard",
    legal_sections: ["MV Act S129"],
    ...overrides,
  };
}
