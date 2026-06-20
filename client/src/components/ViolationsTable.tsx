// Violations data grid. Dense, bordered, shaded sticky-style header with a 2px
// base rule and a subtle alternating row tint (not zebra). Identifiers are
// monospaced. Row click selects (used to navigate to the case file).

import { displaySection, formatDateTime } from "../lib/format";
import type { ViolationRecord } from "../types";
import { ConfidenceBadge, PlateNumber, SeverityBadge, TypeTags } from "./ui";

function topConfidence(r: ViolationRecord): number | null {
  if (!r.violations.length) return null;
  return Math.max(...r.violations.map((v) => v.confidence ?? 0));
}

const TH =
  "border-b-2 border-slate-200 bg-slate-100 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap";
const TD = "border-b border-slate-200 px-3 py-2 align-middle whitespace-nowrap";

export function ViolationsTable({
  records,
  selectedId,
  onSelect,
}: {
  records: ViolationRecord[];
  selectedId?: string | null;
  onSelect: (r: ViolationRecord) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className={TH}>Case ID</th>
            <th className={TH}>Captured</th>
            <th className={TH}>Plate</th>
            <th className={TH}>Violations</th>
            <th className={TH}>Severity</th>
            <th className={TH}>Confidence</th>
            <th className={TH}>Section</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const selected = r.violation_id === selectedId;
            const rowBg = selected
              ? "bg-blue-50 shadow-[inset_3px_0_0_0_var(--color-brand)]"
              : i % 2 === 1
                ? "bg-slate-50 hover:bg-slate-100"
                : "bg-white hover:bg-slate-100";
            return (
              <tr
                key={r.violation_id}
                onClick={() => onSelect(r)}
                aria-selected={selected}
                className={`cursor-pointer ${rowBg}`}
              >
                <td className={`${TD} font-mono text-xs text-slate-500`}>{r.violation_id.slice(0, 8)}</td>
                <td className={`${TD} tnum text-slate-700`}>{formatDateTime(r.timestamp)}</td>
                <td className={TD}>
                  <PlateNumber plate={r.plate_number} />
                </td>
                <td className={TD}>
                  <TypeTags violations={r.violations} />
                </td>
                <td className={TD}>
                  <SeverityBadge severity={r.severity} />
                </td>
                <td className={TD}>
                  <ConfidenceBadge value={topConfidence(r)} />
                </td>
                <td className={`${TD} font-mono text-xs text-slate-600`}>
                  {displaySection(r.legal_sections.find((s) => s && s !== "Unknown") ?? "")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
