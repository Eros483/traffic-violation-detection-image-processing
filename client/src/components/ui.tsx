// Shared primitives. Chips are rectangular (rounded-md) with explicit 1px
// borders and high-contrast text — utilitarian, not pill-shaped. Colour always
// encodes meaning (severity / confidence / status).

import type { ReactNode } from "react";
import {
  BAND_LABEL,
  confidenceBand,
  pct,
  violationLabel,
} from "../lib/format";
import type { Severity, Violation } from "../lib/types";

const CHIP = "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function SeverityChip({ severity }: { severity: Severity }) {
  return severity === "high" ? (
    <span className={`${CHIP} border-red-300 bg-red-50 text-red-700`}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
      High
    </span>
  ) : (
    <span className={`${CHIP} border-slate-300 bg-slate-100 text-slate-700`}>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
      Standard
    </span>
  );
}

export function ConfidenceChip({ value }: { value: number | null }) {
  if (value == null) return <span className="italic text-slate-400">—</span>;
  const band = confidenceBand(value);
  const cls =
    band === "high"
      ? "border-green-300 bg-green-50 text-green-700"
      : band === "med"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-red-300 bg-red-50 text-red-700";
  // Wider padding so e.g. "High · 90%" reads comfortably in one chip.
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium ${cls}`}>
      {BAND_LABEL[band]}
      <span className="tnum opacity-70">· {pct(value)}</span>
    </span>
  );
}

// Status badges are pill-shaped with a solid tint fill (operational state reads
// at a glance). Paid is future-proofed in green.
export function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "paid" || s === "issued" || s === "confirmed"
      ? "bg-green-100 text-green-800"
      : s === "pending"
        ? "bg-amber-100 text-amber-800"
        : s === "disputed" || s === "cancelled"
          ? "bg-red-100 text-red-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

/** Violation types as compact rectangular tags. */
export function TypeTags({ violations, max = 2 }: { violations: Violation[]; max?: number }) {
  const shown = violations.slice(0, max);
  const extra = violations.length - shown.length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {shown.map((v, i) => (
        <span
          key={`${v.type}-${i}`}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700"
        >
          {violationLabel(v.type)}
        </span>
      ))}
      {extra > 0 && <span className="text-xs text-slate-500">+{extra}</span>}
    </span>
  );
}

export function PlateText({ plate }: { plate: string | null }) {
  // Unreadable plate: a faint italic dash — no button styling that would imply
  // an action that doesn't exist.
  if (!plate) return <span className="italic text-slate-400">—</span>;
  return <span className="font-mono text-[13px] font-semibold tracking-wide text-slate-900">{plate}</span>;
}

export function EmptyState({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <p className="max-w-md text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      {label}
    </div>
  );
}
