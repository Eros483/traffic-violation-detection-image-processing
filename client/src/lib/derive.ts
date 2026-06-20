import { confidenceBand } from "./format";
import type { Band } from "./format";
import type { ChallanRecord, Severity, ViolationRecord } from "../types";

export interface CountItem {
  key: string;
  count: number;
}

export interface Analytics {
  total: number;
  bySeverity: Record<Severity, number>;
  byType: CountItem[]; // sorted desc by count
  byVehicle: CountItem[];
  confidenceBands: Record<Band, number>;
  platesRead: number;
  plateHitRate: number; // 0..1
  avgConfidence: number; // 0..1
}

function sortedCounts(map: Map<string, number>): CountItem[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/** Full breakdown of a record set: severity, type, vehicle, confidence, plates. */
export function computeAnalytics(records: ViolationRecord[]): Analytics {
  const bySeverity: Record<Severity, number> = { high: 0, standard: 0 };
  const confidenceBands: Record<Band, number> = { high: 0, med: 0, low: 0 };
  const typeMap = new Map<string, number>();
  const vehicleMap = new Map<string, number>();
  let platesRead = 0;
  let confSum = 0;
  let confN = 0;

  for (const r of records) {
    bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
    vehicleMap.set(r.vehicle_type, (vehicleMap.get(r.vehicle_type) ?? 0) + 1);
    if (r.plate_number) platesRead += 1;
    for (const v of r.violations) {
      typeMap.set(v.type, (typeMap.get(v.type) ?? 0) + 1);
      if (typeof v.confidence === "number" && !Number.isNaN(v.confidence)) {
        confSum += v.confidence;
        confN += 1;
        confidenceBands[confidenceBand(v.confidence)] += 1;
      }
    }
  }

  const total = records.length;
  return {
    total,
    bySeverity,
    byType: sortedCounts(typeMap),
    byVehicle: sortedCounts(vehicleMap),
    confidenceBands,
    platesRead,
    plateHitRate: total ? platesRead / total : 0,
    avgConfidence: confN ? confSum / confN : 0,
  };
}

export interface TrendPoint {
  /** "YYYY-MM-DD" bucket key. */
  date: string;
  /** Short label for the axis, e.g. "20 Jun". */
  label: string;
  count: number;
}

/**
 * Daily violation counts across the last `days` calendar days ending today.
 * Records outside the window are ignored; empty days are kept at zero so the
 * trend line is continuous. `today` is injectable for deterministic tests.
 */
export function dailyTrend(
  records: ViolationRecord[],
  days = 14,
  today: Date = new Date(),
): TrendPoint[] {
  const buckets = new Map<string, number>();
  const order: { date: string; label: string }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
    order.push({
      date: key,
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    });
  }

  for (const r of records) {
    const key = (r.timestamp ?? "").slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return order.map(({ date, label }) => ({ date, label, count: buckets.get(date) ?? 0 }));
}

export interface Offender {
  plate: string;
  count: number;
  highSeverity: number;
  types: string[];
  estimatedFineBasis: number; // number of fineable violations
}

/**
 * Repeat offenders ranked by violation count. Records with no recognised plate
 * are excluded (they cannot be attributed). Ties broken by high-severity count.
 */
export function topOffenders(records: ViolationRecord[], limit = 10): Offender[] {
  const map = new Map<string, Offender>();

  for (const r of records) {
    const plate = r.plate_number;
    if (!plate) continue;
    const entry =
      map.get(plate) ?? { plate, count: 0, highSeverity: 0, types: [], estimatedFineBasis: 0 };
    entry.count += 1;
    if (r.severity === "high") entry.highSeverity += 1;
    for (const v of r.violations) {
      if (!entry.types.includes(v.type)) entry.types.push(v.type);
      entry.estimatedFineBasis += 1;
    }
    map.set(plate, entry);
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.highSeverity - a.highSeverity)
    .slice(0, limit);
}

/** Challan register rollup for the enforcement KPIs. */
export function challanTotals(challans: ChallanRecord[]) {
  const totalFine = challans.reduce((s, c) => s + (c.fine_total ?? 0), 0);
  const pending = challans.filter((c) => c.status?.toLowerCase() === "pending").length;
  const collected = challans
    .filter((c) => ["paid", "confirmed", "issued"].includes(c.status?.toLowerCase()))
    .reduce((s, c) => s + (c.fine_total ?? 0), 0);
  return { totalFine, pending, collected, count: challans.length };
}
