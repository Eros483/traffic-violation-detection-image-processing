// ViolationCard — a self-contained card summarising one detection: plate,
// severity, types, top confidence, and capture time. Used where a grid of cards
// reads better than a table row (e.g. the live-detection result panel).

import { formatDateTime } from "../../lib/format";
import type { ViolationRecord } from "../../types";
import { ConfidenceBadge, SeverityBadge } from "./Badge";
import { PlateNumber } from "./PlateNumber";
import { TypeTags } from "./TypeTags";

function topConfidence(r: ViolationRecord): number | null {
  if (!r.violations.length) return null;
  return Math.max(...r.violations.map((v) => v.confidence ?? 0));
}

export function ViolationCard({ record, onClick }: { record: ViolationRecord; onClick?: () => void }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick?.() : undefined}
      className={`rounded-md border border-slate-200 bg-white p-3.5 ${clickable ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <PlateNumber plate={record.plate_number} className="text-base" />
        <SeverityBadge severity={record.severity} />
      </div>
      <div className="mt-2.5">
        <TypeTags violations={record.violations} max={3} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        <span className="tnum text-[11px] text-slate-400">{formatDateTime(record.timestamp)}</span>
        <ConfidenceBadge value={topConfidence(record)} />
      </div>
    </div>
  );
}
