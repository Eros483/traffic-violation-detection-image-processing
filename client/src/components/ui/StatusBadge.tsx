import { statusBadge } from "../../lib/badges";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${statusBadge(status)}`}>
      {status}
    </span>
  );
}
