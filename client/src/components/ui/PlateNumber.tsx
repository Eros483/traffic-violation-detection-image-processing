// License-plate display. Monospaced and tracked so plates line up in a column.
// An unread plate renders as a faint italic dash — no button styling that would
// imply an action which doesn't exist.

export function PlateNumber({ plate, className = "" }: { plate: string | null; className?: string }) {
  if (!plate) return <span className="italic text-slate-400">—</span>;
  return (
    <span className={`font-mono text-[13px] font-semibold tracking-wide text-slate-900 ${className}`}>
      {plate}
    </span>
  );
}
