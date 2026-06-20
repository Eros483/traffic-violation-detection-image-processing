// Challans — issued-challan register. Rollup StatCards over the live register,
// then a dense table. Row click opens the challan detail. Card treatment matches
// the dashboard KPIs; status uses the solid-tint pill badge.

import { useNavigate } from "react-router-dom";
import { useConsoleData } from "../context/DataContext";
import { challanTotals } from "../lib/derive";
import { formatDateTime, formatINR, formatNumber, violationShort } from "../lib/format";
import { ACCENT } from "../lib/badges";
import { AsyncBoundary, StatCard, StatusBadge } from "../components/ui";
import { IconReceipt } from "../components/icons";

const TH =
  "border-b-2 border-slate-200 bg-slate-100 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap";
const TD = "border-b border-slate-200 px-3 py-2 align-middle whitespace-nowrap";

export function ChallansList() {
  const { challans, challansLoading, challansError } = useConsoleData();
  const navigate = useNavigate();
  const totals = challanTotals(challans);

  return (
    <div className="space-y-5 p-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Challans issued" value={formatNumber(totals.count)} accent={ACCENT.brand} />
        <StatCard label="Pending payment" value={formatNumber(totals.pending)} accent={ACCENT.warning} />
        <StatCard label="Total fine value" value={formatINR(totals.totalFine)} accent={ACCENT.success} />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <AsyncBoundary
          loading={challansLoading}
          error={challansError}
          empty={!challansLoading && !challansError && challans.length === 0}
          loadingLabel="Loading challans…"
          emptyTitle="No challans issued yet"
          emptyText="Open a violation and issue a challan to populate this register."
          emptyIcon={<IconReceipt width={32} height={32} />}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={TH}>Challan ID</th>
                  <th className={TH}>Issued</th>
                  <th className={TH}>Plate</th>
                  <th className={TH}>Location</th>
                  <th className={TH}>Violations</th>
                  <th className={`${TH} text-right`}>Fine</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c, i) => (
                  <tr
                    key={c.challan_id}
                    onClick={() => navigate(`/challans/${c.challan_id}`)}
                    className={`cursor-pointer ${i % 2 === 1 ? "bg-slate-50" : "bg-white"} hover:bg-slate-100`}
                  >
                    <td className={`${TD} font-mono text-xs text-slate-500`}>{c.challan_id.slice(0, 8)}</td>
                    <td className={`${TD} tnum text-slate-700`}>{formatDateTime(c.issued_at)}</td>
                    <td className={`${TD} font-mono font-semibold text-slate-900`}>
                      {c.plate_number ?? <span className="font-sans font-normal italic text-slate-400">—</span>}
                    </td>
                    <td className={`${TD} text-slate-600`}>{c.location}</td>
                    <td className={`${TD} text-slate-700`}>{c.violations.map((v) => violationShort(v.type)).join(", ")}</td>
                    <td className={`${TD} tnum text-right font-semibold text-slate-900`}>{formatINR(c.fine_total)}</td>
                    <td className={TD}>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncBoundary>
      </div>
    </div>
  );
}
