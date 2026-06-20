// Analytics — daily trend (area chart), type breakdown (donut), and a repeat-
// offenders ranking table. All series are derived client-side from the live
// record set; nothing is fabricated.

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useConsoleData } from "../context/DataContext";
import { dailyTrend, topOffenders } from "../lib/derive";
import { formatINR, formatNumber, violationShort } from "../lib/format";
import { estimatedFine } from "../lib/format";
import { AsyncBoundary, SectionHeader, TrendChart, TypeDonut } from "../components/ui";

const PANEL = "rounded-md border border-slate-200 bg-white";
const TH =
  "border-b-2 border-slate-200 bg-slate-100 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap";
const TD = "border-b border-slate-200 px-3 py-2 align-middle whitespace-nowrap";

export function Analytics() {
  const { records, analytics: a, loading, error } = useConsoleData();
  const navigate = useNavigate();

  const trend = useMemo(() => dailyTrend(records, 30), [records]);
  const offenders = useMemo(() => topOffenders(records, 10), [records]);

  return (
    <div className="p-6">
      <AsyncBoundary
        loading={loading}
        error={error}
        empty={a.total === 0}
        loadingLabel="Loading analytics…"
        emptyTitle="No data to analyse"
        emptyText="The detection log is empty. Process images to populate analytics."
      >
        <div className="space-y-5">
          <div className={PANEL}>
            <SectionHeader title="Violation trend — last 30 days" />
            <div className="px-3 py-4">
              <TrendChart data={trend} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className={PANEL}>
              <SectionHeader title="Violations by type" />
              <div className="px-4 py-5">
                <TypeDonut data={a.byType} total={a.total} />
              </div>
            </div>

            <div className={PANEL}>
              <SectionHeader title="Top repeat offenders" />
              {offenders.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No attributable plates yet — offenders are ranked only where a plate was recognised.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <th className={`${TH} w-8`}>#</th>
                        <th className={TH}>Plate</th>
                        <th className={TH}>Types</th>
                        <th className={`${TH} text-right`}>Cases</th>
                        <th className={`${TH} text-right`}>Est. fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offenders.map((o, i) => (
                        <tr
                          key={o.plate}
                          className={`cursor-pointer ${i % 2 === 1 ? "bg-slate-50" : "bg-white"} hover:bg-slate-100`}
                          onClick={() => navigate(`/violations?plate=${encodeURIComponent(o.plate)}`)}
                        >
                          <td className={`${TD} tnum text-slate-400`}>{i + 1}</td>
                          <td className={`${TD} font-mono font-semibold text-slate-900`}>{o.plate}</td>
                          <td className={`${TD} text-slate-600`}>
                            {o.types.map((t) => violationShort(t)).join(", ")}
                          </td>
                          <td className={`${TD} tnum text-right font-semibold text-slate-900`}>{formatNumber(o.count)}</td>
                          <td className={`${TD} tnum text-right text-slate-700`}>
                            {formatINR(estimatedFineForCases(o))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </AsyncBoundary>
    </div>
  );
}

// Estimated total fine basis across an offender's flagged violations.
function estimatedFineForCases(o: { types: string[]; estimatedFineBasis: number }): number {
  // Average per-type fine across this offender's distinct types, scaled by the
  // number of flagged violations — a coarse exposure estimate, not a billed sum.
  if (!o.types.length) return 0;
  const perType = estimatedFine(o.types.map((t) => ({ type: t }))) / o.types.length;
  return Math.round(perType * o.estimatedFineBasis);
}
