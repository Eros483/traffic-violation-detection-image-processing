// Challans — issued-challan register. Card treatment matches the Overview KPIs
// (accented left border, sparkline base); same dense grid language as
// violations. Status uses the pill badges.

import { Sparkline } from "../components/charts";
import { EmptyState, Spinner, StatusChip } from "../components/ui";
import { IconAlert, IconReceipt } from "../components/icons";
import { formatDateTime, formatINR, formatNumber, violationLabel } from "../lib/format";
import type { Challan } from "../lib/types";

const TH = "border-b-2 border-slate-200 bg-slate-100 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap";
const TD = "border-b border-slate-200 px-3 py-2 align-middle whitespace-nowrap";
const LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500";

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-md border border-slate-200 border-l-[3px] bg-white p-4" style={{ borderLeftColor: accent }}>
      <div className={LABEL}>{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="tnum text-[32px] font-bold leading-none text-slate-900">{value}</div>
        <Sparkline color={accent} />
      </div>
    </div>
  );
}

export function Challans({
  challans,
  loading,
  error,
}: {
  challans: Challan[];
  loading: boolean;
  error: string | null;
}) {
  const totalFine = challans.reduce((s, c) => s + (c.fine_total ?? 0), 0);
  const pending = challans.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-5 p-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Challans issued" value={formatNumber(challans.length)} accent="#6B728E" />
        <StatCard label="Pending payment" value={formatNumber(pending)} accent="#B0894F" />
        <StatCard label="Total fine value" value={formatINR(totalFine)} accent="#5D8A6A" />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {loading ? (
          <Spinner label="Loading challans…" />
        ) : error ? (
          <EmptyState
            title="Can't reach the detection API"
            text="Start the backend with `make run-api`."
            icon={<IconAlert width={32} height={32} />}
          />
        ) : challans.length === 0 ? (
          <EmptyState
            title="No challans issued yet"
            text="Open a violation in the Violations log and issue a challan to populate this register."
            icon={<IconReceipt width={32} height={32} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={TH}>Challan ID</th>
                  <th className={TH}>Issued</th>
                  <th className={TH}>Plate</th>
                  <th className={TH}>Location</th>
                  <th className={TH}>Violations</th>
                  <th className={TH}>Sections</th>
                  <th className={`${TH} text-right`}>Fine</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c, i) => (
                  <tr key={c.challan_id} className={i % 2 === 1 ? "bg-slate-50 hover:bg-slate-100" : "bg-white hover:bg-slate-100"}>
                    <td className={`${TD} font-mono text-xs text-slate-500`}>{c.challan_id.slice(0, 8)}</td>
                    <td className={`${TD} tnum text-slate-700`}>{formatDateTime(c.issued_at)}</td>
                    <td className={`${TD} font-mono font-semibold text-slate-900`}>
                      {c.plate_number ?? <span className="font-sans font-normal italic text-slate-400">—</span>}
                    </td>
                    <td className={`${TD} text-slate-600`}>{c.location}</td>
                    <td className={`${TD} text-slate-700`}>
                      {c.violations.map((v) => violationLabel(v.type)).join(", ")}
                    </td>
                    <td className={`${TD} font-mono text-xs text-slate-600`}>{c.legal_sections.join(", ")}</td>
                    <td className={`${TD} tnum text-right font-semibold text-slate-900`}>{formatINR(c.fine_total)}</td>
                    <td className={TD}>
                      <StatusChip status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
