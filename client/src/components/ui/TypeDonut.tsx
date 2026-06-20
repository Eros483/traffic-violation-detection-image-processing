// Violation-type breakdown as a Recharts donut with a centred total and a
// legend table. A single full ring would read as a loading state, so the legend
// carries the exact counts and shares. Colours come from the badge system.

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { violationLabel } from "../../lib/format";
import { typeColor } from "../../lib/badges";
import type { CountItem } from "../../lib/derive";

export function TypeDonut({ data, total }: { data: CountItem[]; total: number }) {
  const slices = data.map((d, i) => ({
    name: violationLabel(d.key),
    value: d.count,
    fill: typeColor(d.key, i),
  }));

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={slices.length > 1 ? 2 : 0}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [`${v} cases`, n]}
              contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, padding: "6px 10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tnum text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-[11px] text-slate-500">cases</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.fill }} />
            <span className="truncate text-slate-700">{s.name}</span>
            <span className="tnum ml-auto font-semibold text-slate-900">{s.value}</span>
            <span className="tnum w-10 text-right text-slate-500">
              {total ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
