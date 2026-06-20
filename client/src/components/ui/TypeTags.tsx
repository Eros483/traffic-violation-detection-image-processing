// Compact rectangular tags for a record's violation types. Truncates to `max`
// with a "+N" overflow indicator so dense table rows stay single-line.

import { violationShort } from "../../lib/format";
import type { Violation } from "../../types";

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
          {violationShort(v.type)}
        </span>
      ))}
      {extra > 0 && <span className="text-xs text-slate-500">+{extra}</span>}
    </span>
  );
}
