import type { ViolationType } from "../types";

export interface ViolationMeta {
  /** Full display label. */
  label: string;
  /** Compact label for dense tables / tags. */
  short: string;
  /** Statutory fine in rupees (mirror of FINE_MAP in challans.py). */
  fine: number;
  /** Cited section (mirror of LEGAL_SECTION_MAP in challans.py). */
  section: string;
}

export const VIOLATION_META: Record<string, ViolationMeta> = {
  helmet: { label: "No Helmet", short: "No Helmet", fine: 1000, section: "MV Act Section 129" },
  triple_riding: { label: "Triple Riding", short: "Triple Riding", fine: 1000, section: "MV Act Section 128" },
  mobile_phone: { label: "Mobile Phone Use", short: "Mobile Use", fine: 5000, section: "MV Act Section 184" },
  red_light: { label: "Red Light Jump", short: "Signal Jump", fine: 5000, section: "MV Act Section 119/177" },
  wrong_side: { label: "Wrong-Side Driving", short: "Wrong Side", fine: 1000, section: "MV Act Section 119" },
  wrong_side_driving: { label: "Wrong-Side Driving", short: "Wrong Side", fine: 1000, section: "MV Act Section 119" },
  parking: { label: "Illegal Parking", short: "Parking", fine: 500, section: "MV Act Section 122" },
  illegal_parking: { label: "Illegal Parking", short: "Parking", fine: 500, section: "MV Act Section 122" },
  seatbelt: { label: "No Seatbelt", short: "No Seatbelt", fine: 1000, section: "MV Act Section 194B" },
  stop_line: { label: "Stop-Line Crossing", short: "Stop-line", fine: 5000, section: "MV Act Section 119/177" },
};

/** Section lookup used where only the citation is needed. */
export const LEGAL_SECTION: Record<string, string> = Object.fromEntries(
  Object.entries(VIOLATION_META).map(([k, m]) => [k, m.section]),
);

/** Violation types surfaced as filter options (deduped of alias keys). */
export const FILTERABLE_TYPES: ViolationType[] = [
  "helmet",
  "triple_riding",
  "mobile_phone",
  "red_light",
  "wrong_side_driving",
  "seatbelt",
  "stop_line",
  "illegal_parking",
];

export const JURISDICTION = "Bengaluru City · West Division";
export const ISSUING_LOCATION = "Bengaluru City";
