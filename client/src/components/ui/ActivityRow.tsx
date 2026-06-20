import { formatDateTime, violationShort } from "../../lib/format";
import type { ViolationRecord } from "../../types";

export function ActivityRow({ record, onClick }: { record: ViolationRecord; onClick?: () => void }) {
  const types = record.violations.map((v) => violationShort(v.type)).join(", ") || "—";
  const dot = record.severity === "high" ? "bg-red-500" : "bg-slate-400";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
    >
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[13px] font-semibold text-slate-900">
          {record.plate_number ?? <span className="font-sans font-normal italic text-slate-400">Plate unread</span>}
        </span>
        <span className="block truncate text-xs text-slate-500">{types}</span>
      </span>
      <span className="tnum shrink-0 text-[11px] text-slate-400">{formatDateTime(record.timestamp)}</span>
    </button>
  );
}
