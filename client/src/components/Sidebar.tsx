// Navigation rail. Grouped (Monitoring / Enforcement) so the items have
// structure instead of floating. Dark slate with a crisp right edge; the active
// item carries a 3px brand left-border plus a lighter background.

import { formatNumber } from "../lib/format";
import { IconGrid, IconList, IconReceipt } from "./icons";

export type View = "overview" | "violations" | "challans";

interface NavItem {
  id: View;
  label: string;
  icon: typeof IconGrid;
}

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Monitoring",
    items: [
      { id: "overview", label: "Overview", icon: IconGrid },
      { id: "violations", label: "Violations", icon: IconList },
    ],
  },
  {
    label: "Enforcement",
    items: [{ id: "challans", label: "Challans", icon: IconReceipt }],
  },
];

export function Sidebar({
  view,
  onNavigate,
  counts,
}: {
  view: View;
  onNavigate: (v: View) => void;
  counts: Partial<Record<View, number>>;
}) {
  return (
    <aside className="flex h-screen w-56 flex-col bg-gray-900 text-slate-300">
      {/* brand */}
      <div className="border-b border-gray-800 px-4 py-4 leading-tight">
        <div className="text-[13px] font-semibold text-white">Traffic Violation</div>
        <div className="text-[11px] text-slate-400">Detection · Image Processing</div>
      </div>

      {/* grouped nav */}
      <nav className="flex flex-1 flex-col gap-5 px-2 py-4" aria-label="Primary">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                const count = counts[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 border-l-[3px] py-2 pl-2.5 pr-3 text-sm font-medium transition-colors ${
                      active
                        ? "border-blue-500 bg-gray-800 text-white"
                        : "border-transparent text-slate-300 hover:bg-gray-800/50 hover:text-white"
                    }`}
                  >
                    <Icon className={active ? "text-blue-400" : "text-slate-400"} />
                    {item.label}
                    {typeof count === "number" && (
                      <span
                        className={`tnum ml-auto rounded px-1.5 py-0.5 text-[11px] ${
                          active ? "bg-blue-600 text-white" : "bg-gray-800 text-slate-300"
                        }`}
                      >
                        {formatNumber(count)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* footer */}
      <div className="border-t border-gray-800 px-4 py-3 text-[11px] leading-relaxed text-slate-400 opacity-60">
        <div className="font-semibold text-slate-300">Traffic Management Centre</div>
        Infantry Road, Bengaluru
      </div>
    </aside>
  );
}
