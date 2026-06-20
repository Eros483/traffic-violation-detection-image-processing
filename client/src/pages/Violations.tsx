// Violations — the detection log as a dense data grid with standard input-style
// filters and pagination. Row click opens the case file.

import { useMemo, useState } from "react";
import { ViolationsTable } from "../components/ViolationsTable";
import { EmptyState, Spinner } from "../components/ui";
import { IconAlert, IconChevronLeft, IconChevronRight, IconSearch } from "../components/icons";
import { VIOLATION_LABELS } from "../lib/format";
import type { Severity, ViolationRecord } from "../lib/types";

const PAGE_SIZE = 15;

const INPUT = "h-9 rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function Violations({
  records,
  loading,
  error,
  selectedId,
  onSelect,
}: {
  records: ViolationRecord[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (r: ViolationRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return records.filter((r) => {
      if (q && !(r.plate_number ?? "").toUpperCase().includes(q)) return false;
      if (severity !== "all" && r.severity !== (severity as Severity)) return false;
      if (type !== "all" && !r.violations.some((v) => v.type === type)) return false;
      return true;
    });
  }, [records, query, type, severity]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const onFilter = (fn: () => void) => { fn(); setPage(1); };
  const hasFilter = query || type !== "all" || severity !== "all";

  return (
    <div className="p-6">
      {/* filter toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${INPUT} w-64 pl-8 font-mono`}
            placeholder="Search plate number"
            value={query}
            onChange={(e) => onFilter(() => setQuery(e.target.value))}
            aria-label="Search by plate number"
          />
        </div>
        <select className={INPUT} value={type} onChange={(e) => onFilter(() => setType(e.target.value))} aria-label="Filter by type">
          <option value="all">All types</option>
          {Object.entries(VIOLATION_LABELS)
            .filter(([k]) => !["wrong_side_driving", "illegal_parking"].includes(k))
            .map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
        </select>
        <select className={INPUT} value={severity} onChange={(e) => onFilter(() => setSeverity(e.target.value))} aria-label="Filter by severity">
          <option value="all">All severity</option>
          <option value="high">High</option>
          <option value="standard">Standard</option>
        </select>
        {hasFilter && (
          <button
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => onFilter(() => { setQuery(""); setType("all"); setSeverity("all"); })}
          >
            Clear
          </button>
        )}
        <span className="tnum ml-auto text-xs text-slate-500">
          {filtered.length} of {records.length} records
        </span>
      </div>

      {/* grid */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {loading ? (
          <Spinner label="Loading violations…" />
        ) : error ? (
          <EmptyState
            title="Can't reach the detection API"
            text="Start the backend with `make run-api`."
            icon={<IconAlert width={32} height={32} />}
          />
        ) : rows.length === 0 ? (
          <EmptyState title="No matching violations" text="No records match the current filters." />
        ) : (
          <>
            <ViolationsTable records={rows} selectedId={selectedId} onSelect={onSelect} />
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="tnum">Page {current} of {pageCount}</span>
              <div className="flex gap-1.5">
                <button
                  className="flex h-7 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  disabled={current <= 1}
                  onClick={() => setPage(current - 1)}
                  aria-label="Previous page"
                >
                  <IconChevronLeft width={15} height={15} />
                </button>
                <button
                  className="flex h-7 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  disabled={current >= pageCount}
                  onClick={() => setPage(current + 1)}
                  aria-label="Next page"
                >
                  <IconChevronRight width={15} height={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
