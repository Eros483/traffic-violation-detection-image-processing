// KPICard — the headline dashboard card. Larger than StatCard, supports column
// spanning so one KPI can anchor a row, and pairs the value with a descriptive
// sub-line plus a base sparkline.

import type { ReactNode } from "react";
import { Sparkline } from "./Sparkline";

const LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500";

export function KPICard({
  label,
  value,
  sub,
  accent,
  span = 1,
  points,
}: {
  label: string;
  value: string;
  sub: ReactNode;
  accent: string; // hex
  span?: number;
  points?: number[];
}) {
  return (
    <div
      className="rounded-md border border-slate-200 border-l-[3px] bg-white p-4"
      style={{ borderLeftColor: accent, gridColumn: `span ${span} / span ${span}` }}
    >
      <div className={LABEL}>{label}</div>
      <div className="tnum mt-2 text-[32px] font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-xs text-slate-500">{sub}</div>
        <Sparkline color={accent} points={points} />
      </div>
    </div>
  );
}
