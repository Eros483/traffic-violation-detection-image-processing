import { VIOLATION_META } from "./constants";

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function violationLabel(type: string): string {
  return VIOLATION_META[type]?.label ?? titleCase(type);
}

export function violationShort(type: string): string {
  return VIOLATION_META[type]?.short ?? titleCase(type);
}

export function vehicleLabel(type: string): string {
  if (type === "two_wheeler") return "Two-wheeler";
  if (type === "vehicle") return "Vehicle";
  return titleCase(type || "Unknown");
}

/** Estimated fine for a set of violations (matches backend summation). */
export function estimatedFine(violations: { type: string }[]): number {
  return violations.reduce((sum, v) => sum + (VIOLATION_META[v.type]?.fine ?? 0), 0);
}

/** Normalise a section token for display: "MV Act S129" → "MV Act §129". */
export function displaySection(token: string): string {
  if (!token || token === "Unknown") return "—";
  return token.replace(/\bS(?:ection\s*)?(\d+)/i, "§$1");
}

/* ---- confidence banding ---- */
export type Band = "high" | "med" | "low";

export function confidenceBand(v: number): Band {
  if (v >= 0.85) return "high";
  if (v >= 0.7) return "med";
  return "low";
}

export const BAND_LABEL: Record<Band, string> = { high: "High", med: "Med", low: "Low" };

export function pct(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Indian rupee, no decimals: 2000 → "₹2,000". */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Absolute timestamp: "20 Jun 2026, 10:03". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date}, ${time}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function shortId(id: string): string {
  return id.length > 10 ? id.slice(0, 8) : id;
}
