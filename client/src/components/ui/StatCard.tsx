import type { ReactNode } from "react";
import { Sparkline } from "./Sparkline";

const LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500";

export function StatCard({
  label,
  value,
  accent,
  sub,
  spark = true,
}: {
  label: string;
  value: string;
  accent: string; // hex
  sub?: ReactNode;
  spark?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 border-l-[3px] bg-white p-4" style={{ borderLeftColor: accent }}>
      <div className={LABEL}>{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="tnum text-[32px] font-bold leading-none text-slate-900">{value}</div>
        {spark && <Sparkline color={accent} />}
      </div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
