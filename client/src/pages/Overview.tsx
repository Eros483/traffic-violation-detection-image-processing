// Overview — accented KPI cards (weighted, with a base sparkline), model
// performance, and breakdowns (type donut + proportional confidence bars).

import type { ReactNode } from "react";
import { Sparkline, TypeDonut } from "../components/charts";
import { EmptyState, Spinner } from "../components/ui";
import { IconAlert, IconInfo } from "../components/icons";
import type { Analytics } from "../lib/analytics";
import { formatNumber, pct } from "../lib/format";
import type { ModelMetrics } from "../lib/types";

const LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500";
const NUMBER = "mt-2 text-[32px] font-bold leading-none text-slate-900";

function StatCard({
  label,
  value,
  sub,
  accent,
  span = 1,
}: {
  label: string;
  value: string;
  sub: ReactNode;
  accent: string; // hex
  span?: number;
}) {
  return (
    <div
      className="rounded-md border border-slate-200 border-l-[3px] bg-white p-4"
      style={{ borderLeftColor: accent, gridColumn: `span ${span} / span ${span}` }}
    >
      <div className={LABEL}>{label}</div>
      <div className={`tnum ${NUMBER}`}>{value}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-xs text-slate-500">{sub}</div>
        <Sparkline color={accent} />
      </div>
    </div>
  );
}

function ConfBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const w = total ? (value / total) * 100 : 0;
  const inside = w >= 22;
  const label_pct = `${Math.round(w)}%`;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-36 shrink-0 text-[13px] text-slate-700">{label}</div>
      <div className="relative h-3 flex-1 rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full pr-1.5"
          style={{ width: `${w}%`, background: color }}
        >
          {inside && <span className="text-[10px] font-semibold text-white">{label_pct}</span>}
        </div>
        {!inside && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-600"
            style={{ left: `calc(${w}% + 6px)` }}
          >
            {label_pct}
          </span>
        )}
      </div>
      <div className="tnum w-8 text-right text-[13px] font-semibold text-slate-900">{formatNumber(value)}</div>
    </div>
  );
}

const PANEL = "rounded-md border border-slate-200 bg-white";
const PANEL_HEAD = "border-b border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-900";

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3.5">
      <div className={LABEL}>{label}</div>
      <div className="tnum mt-1.5 text-[26px] font-bold leading-none text-slate-900">{value}</div>
    </div>
  );
}

export function Overview({
  analytics: a,
  metrics,
  loading,
  error,
}: {
  analytics: Analytics;
  metrics: ModelMetrics | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) return <div className="p-6"><Spinner label="Loading enforcement data…" /></div>;
  if (error)
    return (
      <div className="p-6">
        <div className={PANEL}>
          <EmptyState
            title="Can't reach the detection API"
            text="Start the backend with `make run-api`. The console reads live from the FastAPI service."
            icon={<IconAlert width={32} height={32} />}
          />
        </div>
      </div>
    );

  const d = metrics?.detector;
  const highShare = a.total ? a.bySeverity.high / a.total : 0;

  return (
    <div className="space-y-5 p-6">
      {/* KPI cards — weighted: Total anchors the row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Total violations"
          value={formatNumber(a.total)}
          sub="in detection log"
          accent="#6B728E"
          span={2}
        />
        <StatCard
          label="High severity"
          value={formatNumber(a.bySeverity.high)}
          sub={`${pct(highShare)} of cases`}
          accent="#B75D5D"
        />
        <StatCard
          label="Plate hit-rate"
          value={pct(a.plateHitRate)}
          sub={`${formatNumber(a.platesRead)} of ${formatNumber(a.total)}`}
          accent="#B0894F"
        />
        <StatCard
          label="Avg. detection conf."
          value={pct(a.avgConfidence)}
          sub="across all flags"
          accent="#5D8A6A"
        />
      </div>

      {/* model performance */}
      <div className={PANEL}>
        <div className={`${PANEL_HEAD} flex items-center gap-1.5`}>
          Model performance
          <span title="Source: outputs/metrics.json (make evaluate)" className="cursor-help text-slate-400">
            <IconInfo width={14} height={14} />
          </span>
        </div>
        {d ? (
          <div className="grid grid-cols-4 gap-px bg-slate-200">
            <MetricTile label="Precision" value={pct(d.precision, 1)} />
            <MetricTile label="Recall" value={pct(d.recall, 1)} />
            <MetricTile label="mAP@50" value={pct(d.mAP50, 1)} />
            <MetricTile label="mAP@50–95" value={pct(d.mAP50_95, 1)} />
          </div>
        ) : (
          <EmptyState title="Metrics unavailable" text="Run `make evaluate` to generate outputs/metrics.json." />
        )}
      </div>

      {/* breakdowns */}
      <div className="grid grid-cols-2 gap-5">
        <div className={PANEL}>
          <div className={PANEL_HEAD}>Violations by type</div>
          <div className="px-4 py-5">
            <TypeDonut data={a.byType} total={a.total} />
          </div>
        </div>
        <div className={PANEL}>
          <div className={PANEL_HEAD}>Detection confidence</div>
          <div className="px-4 py-4">
            <ConfBar label="High (≥85%)" value={a.confidenceBands.high} total={a.total} color="#5D8A6A" />
            <ConfBar label="Medium (70–85%)" value={a.confidenceBands.med} total={a.total} color="#B0894F" />
            <ConfBar label="Low (<70%)" value={a.confidenceBands.low} total={a.total} color="#B75D5D" />
          </div>
        </div>
      </div>
    </div>
  );
}
