// Chart primitives. The type breakdown is a Recharts donut (a single full bar
// reads as a loading state); the stat-card sparklines are small, static, and
// purely decorative — they carry no fabricated metric, they just give the
// number a visual base instead of floating in a box.

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { violationLabel } from "../lib/format";
import type { CountItem } from "../lib/analytics";

// Categorical colours for violation types (distinct, on-palette).
const TYPE_COLORS: Record<string, string> = {
  helmet: "#6b728e",
  triple_riding: "#7e7393",
  mobile_phone: "#b0894f",
  red_light: "#b75d5d",
  wrong_side: "#5e7e86",
  wrong_side_driving: "#5e7e86",
  seatbelt: "#5d8a6a",
  stop_line: "#9e6b82",
};
const FALLBACK = ["#6b728e", "#7e7393", "#b0894f", "#b75d5d", "#5e7e86", "#5d8a6a"];

export function TypeDonut({ data, total }: { data: CountItem[]; total: number }) {
  const slices = data.map((d, i) => ({
    name: violationLabel(d.key),
    value: d.count,
    fill: TYPE_COLORS[d.key] ?? FALLBACK[i % FALLBACK.length],
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
              contentStyle={{
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                fontSize: 12,
                padding: "6px 10px",
              }}
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

// Static decorative sparkline — fixed shape, just a visual base for a KPI.
const SPARK = [6, 9, 7, 12, 10, 14, 11, 16, 13, 18];
export function Sparkline({ color }: { color: string }) {
  const w = 96;
  const h = 26;
  const max = Math.max(...SPARK);
  const min = Math.min(...SPARK);
  const step = w / (SPARK.length - 1);
  const pts = SPARK.map((v, i) => {
    const x = i * step;
    const y = h - 2 - ((v - min) / (max - min)) * (h - 4);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden="true">
      <path d={area} fill={color} opacity={0.08} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
