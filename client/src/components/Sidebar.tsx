
import { NavLink } from "react-router-dom";
import { formatNumber } from "../lib/format";
import {
  IconActivity,
  IconCamera,
  IconChart,
  IconGrid,
  IconList,
  IconReceipt,
  IconSettings,
} from "./icons";

type IconType = typeof IconGrid;

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  /** Count badge key, if any. */
  count?: number;
  end?: boolean;
}

export interface SidebarCounts {
  violations?: number;
  challans?: number;
}

export function Sidebar({ counts }: { counts: SidebarCounts }) {
  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Monitoring",
      items: [
        { to: "/", label: "Dashboard", icon: IconGrid, end: true },
        { to: "/analytics", label: "Analytics", icon: IconChart },
      ],
    },
    {
      label: "Enforcement",
      items: [
        { to: "/violations", label: "Violations", icon: IconList, count: counts.violations },
        { to: "/challans", label: "Challans", icon: IconReceipt, count: counts.challans },
      ],
    },
    {
      label: "Tools",
      items: [
        { to: "/live", label: "Live Detection", icon: IconCamera },
        { to: "/youtube", label: "YouTube Video", icon: IconCamera },
        { to: "/settings", label: "Settings", icon: IconSettings },
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-gray-900 text-slate-300">
      <div className="flex items-center gap-2.5 border-b border-gray-800 px-4 py-4 leading-tight">
        <IconActivity className="text-blue-400" width={20} height={20} />
        <div>
          <div className="text-[13px] font-semibold text-[#fff]">Traffic Violation</div>
          <div className="text-[11px] text-slate-400">Detection · Image Processing</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 px-2 py-4" aria-label="Primary">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 border-l-[3px] py-2 pl-2.5 pr-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-blue-500 bg-gray-800 text-[#fff]"
                          : "border-transparent text-slate-300 hover:bg-gray-800/50 hover:text-[#fff]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={isActive ? "text-blue-400" : "text-slate-400"} />
                        {item.label}
                        {typeof item.count === "number" && (
                          <span
                            className={`tnum ml-auto rounded px-1.5 py-0.5 text-[11px] ${
                              isActive ? "bg-blue-600 text-[#fff]" : "bg-gray-800 text-slate-300"
                            }`}
                          >
                            {formatNumber(item.count)}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-800 px-4 py-3 text-[11px] leading-relaxed text-slate-400 opacity-60">
        <div className="font-semibold text-slate-300">Traffic Management Centre</div>
        Infantry Road, Bengaluru
      </div>
    </aside>
  );
}
