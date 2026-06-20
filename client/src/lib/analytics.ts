// Client-side aggregation from the violation records (the backend's summary
// endpoint only returns a total). Pure functions.

import { confidenceBand } from "./format";
import type { Band } from "./format";
import type { Severity, ViolationRecord } from "./types";

export interface CountItem {
  key: string;
  count: number;
}

export interface Analytics {
  total: number;
  bySeverity: Record<Severity, number>;
  byType: CountItem[]; // sorted desc
  byVehicle: CountItem[];
  confidenceBands: Record<Band, number>;
  platesRead: number;
  plateHitRate: number; // 0..1
  avgConfidence: number; // 0..1
}

function sortedCounts(map: Map<string, number>): CountItem[] {
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

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
      if (typeof v.confidence === "number") {
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
