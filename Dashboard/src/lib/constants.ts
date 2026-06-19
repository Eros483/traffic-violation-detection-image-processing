// Static presentation config — NOT API data.
// The backend never exposes labels, fine amounts, legal sections, or colors,
// so these live on the frontend as UI constants.
import type { ViolationType, ViolationMeta } from '../types'

// ── Violation type → human label + statutory fine (₹) ────────────────────────
export const VIOLATION_META: Record<ViolationType, ViolationMeta> = {
  helmet:        { label: 'No Helmet',         fine: 1000 },
  triple_riding: { label: 'Triple Riding',     fine: 1000 },
  mobile_phone:  { label: 'Mobile Phone Use',  fine: 5000 },
  red_light:     { label: 'Red Light Jump',    fine: 5000 },
  wrong_side:    { label: 'Wrong-Side Riding', fine: 1000 },
  parking:       { label: 'Illegal Parking',   fine: 500  },
  seatbelt:      { label: 'No Seatbelt',       fine: 1000 },
}

// Fallback for any violation type the backend emits that we don't have config for
// (e.g. backend uses `wrong_side_driving`). Keeps the UI from rendering blanks.
export function violationLabel(type: string): string {
  return VIOLATION_META[type as ViolationType]?.label
    ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Type → MV Act section (used when a record carries no legal_sections) ──────
export const LEGAL_SECTION: Record<ViolationType, string> = {
  helmet:        'MV Act Section 129',
  triple_riding: 'MV Act Section 128',
  mobile_phone:  'MV Act Section 184',
  red_light:     'MV Act Section 119/177',
  wrong_side:    'MV Act Section 119',
  parking:       'MV Act Section 122',
  seatbelt:      'MV Act Section 194B',
}
