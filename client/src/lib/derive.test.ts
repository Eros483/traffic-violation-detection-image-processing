import { describe, expect, it } from "vitest";
import { challanTotals, computeAnalytics, dailyTrend, topOffenders } from "./derive";
import { makeRecord } from "../test/fixtures";
import type { ChallanRecord } from "../types";

describe("computeAnalytics", () => {
  it("breaks down severity, type, and plate hit-rate", () => {
    const records = [
      makeRecord({ severity: "high", plate_number: "KA-01-AA-0001", violations: [{ type: "red_light", confidence: 0.9 }] }),
      makeRecord({ severity: "standard", plate_number: null, violations: [{ type: "helmet", confidence: 0.8 }] }),
      makeRecord({ severity: "standard", plate_number: "KA-02-BB-0002", violations: [{ type: "helmet", confidence: 0.6 }] }),
    ];
    const a = computeAnalytics(records);
    expect(a.total).toBe(3);
    expect(a.bySeverity.high).toBe(1);
    expect(a.bySeverity.standard).toBe(2);
    expect(a.byType[0]).toEqual({ key: "helmet", count: 2 }); // sorted desc
    expect(a.platesRead).toBe(2);
    expect(a.plateHitRate).toBeCloseTo(2 / 3);
  });
});

describe("dailyTrend", () => {
  it("returns a continuous zero-filled window ending today", () => {
    const today = new Date("2026-06-20T12:00:00");
    const records = [
      makeRecord({ timestamp: "2026-06-20T08:00:00" }),
      makeRecord({ timestamp: "2026-06-20T09:00:00" }),
      makeRecord({ timestamp: "2026-06-18T09:00:00" }),
    ];
    const trend = dailyTrend(records, 7, today);
    expect(trend).toHaveLength(7);
    expect(trend.at(-1)).toMatchObject({ date: "2026-06-20", count: 2 });
    expect(trend.find((t) => t.date === "2026-06-18")?.count).toBe(1);
    expect(trend.find((t) => t.date === "2026-06-19")?.count).toBe(0);
  });
});

describe("topOffenders", () => {
  it("ranks by count and excludes unattributed plates", () => {
    const records = [
      makeRecord({ plate_number: "KA-01-AA-0001", severity: "high" }),
      makeRecord({ plate_number: "KA-01-AA-0001", severity: "standard" }),
      makeRecord({ plate_number: "KA-02-BB-0002" }),
      makeRecord({ plate_number: null }),
    ];
    const offenders = topOffenders(records);
    expect(offenders).toHaveLength(2);
    expect(offenders[0]).toMatchObject({ plate: "KA-01-AA-0001", count: 2, highSeverity: 1 });
  });
});

describe("challanTotals", () => {
  it("sums fines and counts pending", () => {
    const challans = [
      { fine_total: 1000, status: "pending" },
      { fine_total: 5000, status: "paid" },
    ] as ChallanRecord[];
    const t = challanTotals(challans);
    expect(t.totalFine).toBe(6000);
    expect(t.pending).toBe(1);
    expect(t.count).toBe(2);
  });
});
