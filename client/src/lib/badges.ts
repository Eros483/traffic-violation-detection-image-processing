import type { Band } from "./format";
import type { Severity } from "../types";

/** Outlined chip: 1px border + tinted fill + high-contrast text. */
export const SEVERITY_BADGE: Record<Severity, string> = {
  high: "border-red-300 bg-red-50 text-red-700",
  standard: "border-slate-300 bg-slate-100 text-slate-700",
};

export const CONFIDENCE_BADGE: Record<Band, string> = {
  high: "border-green-300 bg-green-50 text-green-700",
  med: "border-amber-300 bg-amber-50 text-amber-800",
  low: "border-red-300 bg-red-50 text-red-700",
};

/** Solid-tint status pill. Unknown states fall back to neutral slate. */
export function statusBadge(status: string): string {
  const s = status.toLowerCase();
  if (s === "paid" || s === "issued" || s === "confirmed") return "bg-green-100 text-green-800";
  if (s === "pending") return "bg-amber-100 text-amber-800";
  if (s === "disputed" || s === "cancelled") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

/** The accent hex used for KPI left-borders and sparklines, by semantic role. */
export const ACCENT = {
  brand: "#6b728e",
  critical: "#b75d5d",
  warning: "#b0894f",
  success: "#5d8a6a",
} as const;

/** Categorical colours for violation types (distinct, on-palette). */
export const TYPE_COLORS: Record<string, string> = {
  helmet: "#6b728e",
  triple_riding: "#7e7393",
  mobile_phone: "#b0894f",
  red_light: "#b75d5d",
  wrong_side: "#5e7e86",
  wrong_side_driving: "#5e7e86",
  seatbelt: "#5d8a6a",
  stop_line: "#9e6b82",
  illegal_parking: "#7a8a99",
};

export const TYPE_FALLBACK = ["#6b728e", "#7e7393", "#b0894f", "#b75d5d", "#5e7e86", "#5d8a6a"];

export function typeColor(type: string, index = 0): string {
  return TYPE_COLORS[type] ?? TYPE_FALLBACK[index % TYPE_FALLBACK.length];
}
