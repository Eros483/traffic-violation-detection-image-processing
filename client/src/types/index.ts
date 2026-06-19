export type ViolationType =
  | 'helmet'
  | 'triple_riding'
  | 'mobile_phone'
  | 'red_light'
  | 'wrong_side'
  | 'parking'
  | 'seatbelt'

export type Severity = 'high' | 'standard'
export type ChallanStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export interface Violation {
  type: ViolationType
  confidence: number   // 0–1
  description?: string
}

// Matches the backend ViolationRecord (src/evidence.py) served by
// GET /api/violations. image_path is a server-side filesystem path, not a URL,
// so it is not directly renderable in the browser.
export interface ViolationRecord {
  violation_id: string
  timestamp: string          // ISO-8601
  image_path: string         // server-side path to source image
  image_hash: string
  vehicle_bbox: [number, number, number, number] | null
  vehicle_type: 'two_wheeler' | 'four_wheeler' | 'vehicle' | 'unknown' | string
  plate_number: string | null
  plate_confidence: number | null
  violations: Violation[]
  severity: Severity
  legal_sections: string[]
}

export interface Challan {
  challan_id: string
  violation_id: string
  issued_at: string
  vehicle_type: string
  plate_number: string | null
  location: string
  violations: Violation[]
  legal_sections: string[]
  fine_total: number
  status: ChallanStatus
  image_ref: string
  image_hash: string
}

export interface ViolationMeta {
  label: string
  fine: number
}