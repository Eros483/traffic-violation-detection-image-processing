export function PlateNumber({ plate, className = "" }: { plate: string | null; className?: string }) {
  if (!plate) return <span className="italic text-slate-400">—</span>;
  return (
    <span className={`font-mono text-[13px] font-semibold tracking-wide text-slate-900 ${className}`}>
      {plate}
    </span>
  );
}
