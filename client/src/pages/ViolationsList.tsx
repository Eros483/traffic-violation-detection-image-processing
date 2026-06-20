// Violations — the detection log as a dense data grid with input-style filters
// and pagination. A `?plate=` query param (used by the offenders ranking) seeds
// the search. Row click opens the case file at /violations/:id.

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useConsoleData } from "../context/DataContext";
import { ViolationsTable } from "../components/ViolationsTable";
import { AsyncBoundary } from "../components/ui";
import { IconChevronLeft, IconChevronRight, IconSearch } from "../components/icons";
import { FILTERABLE_TYPES } from "../lib/constants";
import { violationLabel } from "../lib/format";
import type { Severity, ViolationRecord } from "../types";

const PAGE_SIZE = 15;
const INPUT =
  "h-9 rounded-md border border-slate-300 bg-white px-3 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function ViolationsList() {
  const { records, loading, error } = useConsoleData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("plate") ?? "");
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
  const onFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };
  const hasFilter = query || type !== "all" || severity !== "all";
  const open = (r: ViolationRecord) => navigate(`/violations/${r.violation_id}`);

  return (
    <div className="p-6">
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
          {FILTERABLE_TYPES.map((k) => (
            <option key={k} value={k}>
              {violationLabel(k)}
            </option>
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
            onClick={() => onFilter(() => {
              setQuery("");
              setType("all");
              setSeverity("all");
            })}
          >
            Clear
          </button>
        )}
        <span className="tnum ml-auto text-xs text-slate-500">
          {filtered.length} of {records.length} records
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <AsyncBoundary
          loading={loading}
          error={error}
          empty={!loading && !error && rows.length === 0}
          loadingLabel="Loading violations…"
          emptyTitle="No matching violations"
          emptyText={records.length === 0 ? "The detection log is empty." : "No records match the current filters."}
        >
          <ViolationsTable records={rows} onSelect={open} />
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="tnum">
              Page {current} of {pageCount}
            </span>
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
        </AsyncBoundary>
      </div>
    </div>
  );
}
