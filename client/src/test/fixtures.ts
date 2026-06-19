import type { ViolationRecord } from '../types'

// Builds a ViolationRecord shaped exactly like the backend's JSONL output.
export function makeRecord(overrides: Partial<ViolationRecord> = {}): ViolationRecord {
  return {
    violation_id: 'vio-test-1',
    timestamp: '2026-06-15T10:02:00+05:30', // a Monday
    image_path: 'data/raw/sample.jpg',
    image_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b',
    vehicle_bbox: [10, 20, 30, 40],
    vehicle_type: 'two_wheeler',
    plate_number: 'KA-01-AB-1234',
    plate_confidence: 0.82,
    violations: [{ type: 'helmet', confidence: 0.91, description: 'No helmet' }],
    severity: 'standard',
    legal_sections: ['MV Act S129'],
    ...overrides,
  }
}
