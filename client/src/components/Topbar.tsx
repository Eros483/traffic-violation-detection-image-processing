// Page header. White, hard 1px bottom border. Title sits above a receding
// subtitle; the live indicator pulses when the API is connected; jurisdiction
// and date are stacked on the right.

import type { ConnState } from "../App";

const STATUS: Record<ConnState, { label: string; dot: string; text: string; live: boolean }> = {
  ok: { label: "Live", dot: "bg-green-500", text: "text-slate-600", live: true },
  down: { label: "API unreachable", dot: "bg-red-500", text: "text-red-600", live: false },
  loading: { label: "Connecting", dot: "bg-amber-500", text: "text-slate-500", live: false },
};

export function Topbar({ title, subtitle, conn }: { title: string; subtitle: string; conn: ConnState }) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const s = STATUS[conn];
  return (
    <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.3px] text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-5">
        <span className={`inline-flex items-center gap-2 text-xs font-medium ${s.text}`}>
          <span className="relative flex h-2 w-2">
            {s.live && (
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${s.dot}`}
                style={{ animation: "var(--animate-live)" }}
              />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
          </span>
          {s.label}
        </span>
        <div className="border-l border-slate-200 pl-5 text-right leading-tight">
          <div className="text-xs font-semibold text-slate-700">Bengaluru City · West Division</div>
          <div className="tnum mt-0.5 text-[11px] text-slate-500">{today}</div>
        </div>
      </div>
    </header>
  );
}
