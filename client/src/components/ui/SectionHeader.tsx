import type { ReactNode } from "react";

export function SectionHeader({
  title,
  hint,
  trailing,
}: {
  title: string;
  hint?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 border-b border-slate-200 px-4 py-3">
      <span className="text-[13px] font-semibold text-slate-900">{title}</span>
      {hint}
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>
  );
}
