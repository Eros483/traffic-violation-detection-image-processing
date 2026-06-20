import type { ReactNode } from "react";
import { BAND_LABEL, confidenceBand, pct } from "../../lib/format";
import { CONFIDENCE_BADGE, SEVERITY_BADGE } from "../../lib/badges";
import type { Severity } from "../../types";

const BASE =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function Badge({
  children,
  className = "border-slate-300 bg-slate-100 text-slate-700",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`${BASE} ${className}`}>{children}</span>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const dot = severity === "high" ? "bg-red-600" : "bg-slate-500";
  return (
    <span className={`${BASE} ${SEVERITY_BADGE[severity]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {severity === "high" ? "High" : "Standard"}
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="italic text-slate-400">—</span>;
  const band = confidenceBand(value);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium ${CONFIDENCE_BADGE[band]}`}>
      {BAND_LABEL[band]}
      <span className="tnum opacity-70">· {pct(value)}</span>
    </span>
  );
}
