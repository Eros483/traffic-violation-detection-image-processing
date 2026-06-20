// Confidence meter. A thin proportional bar tinted by confidence band, with the
// percentage tabulated alongside. Used in the case file where a chip would be
// too coarse and the exact value matters.

import { confidenceBand, pct } from "../../lib/format";
import { ACCENT } from "../../lib/badges";

const BAND_COLOR = { high: ACCENT.success, med: ACCENT.warning, low: ACCENT.critical } as const;

export function ConfidenceMeter({ value }: { value: number | null }) {
  if (value == null) return <span className="italic text-slate-400">—</span>;
  const band = confidenceBand(value);
  const w = Math.max(2, Math.min(100, value * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: BAND_COLOR[band] }} />
      </div>
      <span className="tnum text-xs font-semibold text-slate-700">{pct(value)}</span>
    </div>
  );
}
