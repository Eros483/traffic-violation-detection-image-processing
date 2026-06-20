import { describe, expect, it } from "vitest";
import { FILTERABLE_TYPES, LEGAL_SECTION, VIOLATION_META } from "./constants";

describe("constants", () => {
  it("mirrors the backend fine map for core violation types", () => {
    expect(VIOLATION_META.helmet.fine).toBe(1000);
    expect(VIOLATION_META.mobile_phone.fine).toBe(5000);
    expect(VIOLATION_META.illegal_parking.fine).toBe(500);
  });

  it("derives LEGAL_SECTION from the meta table", () => {
    for (const [key, meta] of Object.entries(VIOLATION_META)) {
      expect(LEGAL_SECTION[key]).toBe(meta.section);
    }
  });

  it("gives every meta entry a non-empty label and section", () => {
    for (const meta of Object.values(VIOLATION_META)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.section).toMatch(/MV Act/);
    }
  });

  it("exposes a deduped set of filterable types", () => {
    expect(new Set(FILTERABLE_TYPES).size).toBe(FILTERABLE_TYPES.length);
    expect(FILTERABLE_TYPES).toContain("helmet");
    // Alias keys (wrong_side / parking) are not surfaced as separate filters.
    expect(FILTERABLE_TYPES).not.toContain("wrong_side");
  });
});
