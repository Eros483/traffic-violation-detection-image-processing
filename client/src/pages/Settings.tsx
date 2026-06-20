import { useConsoleData } from "../context/DataContext";
import { useTheme } from "../theme/ThemeContext";
import type { Theme } from "../theme/ThemeContext";
import { JURISDICTION } from "../lib/constants";
import { SectionHeader } from "../components/ui";
import { IconMoon, IconSun } from "../components/icons";

const PANEL = "rounded-md border border-slate-200 bg-white";
const ROW = "flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 last:border-b-0";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { records, challans } = useConsoleData();

  const options: { value: Theme; label: string; icon: typeof IconSun }[] = [
    { value: "light", label: "Light", icon: IconSun },
    { value: "dark", label: "Dark", icon: IconMoon },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className={PANEL}>
        <SectionHeader title="Appearance" />
        <div className={ROW}>
          <div>
            <div className="text-[13px] font-semibold text-slate-900">Theme</div>
            <div className="text-xs text-slate-500">Light or dark. The accent palette is unchanged across both.</div>
          </div>
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
            {options.map((o) => {
              const Icon = o.icon;
              const active = theme === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setTheme(o.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium ${
                    active ? "bg-blue-700 text-[#fff]" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon width={14} height={14} />
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={PANEL}>
        <SectionHeader title="About" />
        <dl>
          <div className={ROW}>
            <dt className="text-xs text-slate-500">Application</dt>
            <dd className="text-[13px] text-slate-900">Traffic Violation Detection Console</dd>
          </div>
          <div className={ROW}>
            <dt className="text-xs text-slate-500">Jurisdiction</dt>
            <dd className="text-[13px] text-slate-900">{JURISDICTION}</dd>
          </div>
          <div className={ROW}>
            <dt className="text-xs text-slate-500">Records loaded</dt>
            <dd className="tnum text-[13px] text-slate-900">{records.length} violations · {challans.length} challans</dd>
          </div>
          <div className={ROW}>
            <dt className="text-xs text-slate-500">Data source</dt>
            <dd className="text-[13px] text-slate-900">FastAPI backend (live)</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
