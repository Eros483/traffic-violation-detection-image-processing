// Challan status pill. Pill-shaped with a solid tint fill so operational state
// reads at a glance (distinct from the rectangular outlined Badge used for
// detection metadata). Colour comes from the badge colour system.

import { statusBadge } from "../../lib/badges";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${statusBadge(status)}`}>
      {status}
    </span>
  );
}
