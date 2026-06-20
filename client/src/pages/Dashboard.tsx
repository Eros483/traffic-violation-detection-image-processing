import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useConsoleData } from "../context/DataContext";
import { dailyTrend } from "../lib/derive";
import { formatNumber, pct } from "../lib/format";
import { ACCENT } from "../lib/badges";
import { AsyncBoundary, KPICard, SectionHeader, ActivityRow } from "../components/ui";
import { IconCamera, IconChevronRightSm, IconInfo } from "../components/icons";

const PANEL = "rounded-md border border-slate-200 bg-white";

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="tnum mt-1.5 text-[26px] font-bold leading-none text-slate-900">{value}</div>
    </div>
  );
}

export function Dashboard() {
  const { records, analytics: a, metrics, loading, error } = useConsoleData();
  const navigate = useNavigate();

  const trend = useMemo(() => dailyTrend(records, 14), [records]);
  const trendPoints = trend.map((t) => t.count);
  const recent = useMemo(
    () => [...records].sort((x, y) => y.timestamp.localeCompare(x.timestamp)).slice(0, 8),
    [records],
  );

  const d = metrics?.detector;
  const b = metrics?.benchmark;
  const highShare = a.total ? a.bySeverity.high / a.total : 0;

  return (
    <div className="p-6">
      <AsyncBoundary loading={loading} error={error} loadingLabel="Loading enforcement data…">
        <div className="space-y-5">
          <div className="grid grid-cols-5 gap-4">
            <KPICard label="Total violations" value={formatNumber(a.total)} sub="in detection log" accent={ACCENT.brand} span={2} points={trendPoints} />
            <KPICard label="High severity" value={formatNumber(a.bySeverity.high)} sub={`${pct(highShare)} of cases`} accent={ACCENT.critical} />
            <KPICard label="Plate hit-rate" value={pct(a.plateHitRate)} sub={`${formatNumber(a.platesRead)} of ${formatNumber(a.total)}`} accent={ACCENT.warning} />
            <KPICard label="Avg. detection conf." value={pct(a.avgConfidence)} sub="across all flags" accent={ACCENT.success} />
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Model performance"
              hint={
                <span title="Source: outputs/metrics.json (make evaluate)" className="cursor-help text-slate-400">
                  <IconInfo width={14} height={14} />
                </span>
              }
            />
            {d || b ? (
              <div className={`grid gap-px bg-slate-200 ${b ? 'grid-cols-5' : 'grid-cols-4'}`}>
                {d && <>
                  <MetricTile label="Precision" value={pct(d.precision, 1)} />
                  <MetricTile label="Recall" value={pct(d.recall, 1)} />
                  <MetricTile label="mAP@50" value={pct(d.mAP50, 1)} />
                  <MetricTile label="mAP@50–95" value={pct(d.mAP50_95, 1)} />
                </>}
                {b && <>
                  <MetricTile label="Mean latency" value={`${formatNumber(Math.round(b.per_stage_timing.total_ms.mean))} ms`} />
                </>}
              </div>
            ) : (
              <div className="px-4 py-6 text-sm text-slate-500">
                Metrics unavailable. Run <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">make evaluate</code> to generate outputs/metrics.json.
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className={`${PANEL} col-span-2`}>
              <SectionHeader title="Recent activity" />
              {recent.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">No violations recorded yet.</div>
              ) : (
                <div>
                  {recent.map((r) => (
                    <ActivityRow key={r.violation_id} record={r} onClick={() => navigate(`/violations/${r.violation_id}`)} />
                  ))}
                </div>
              )}
            </div>

            <div className={PANEL}>
              <SectionHeader title="Capture source" />
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <IconCamera width={26} height={26} />
                </div>
                <p className="text-sm text-slate-500">
                  Live RTSP ingestion is out of scope for the prototype. Test the pipeline by uploading a still image.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/live")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-2 text-sm font-semibold text-[#fff] hover:bg-blue-800"
                >
                  Open Live Detection
                  <IconChevronRightSm width={15} height={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AsyncBoundary>
    </div>
  );
}
