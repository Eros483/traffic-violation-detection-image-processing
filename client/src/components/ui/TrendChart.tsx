import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ACCENT } from "../../lib/badges";
import type { TrendPoint } from "../../lib/derive";

export function TrendChart({ data, height = 240 }: { data: TrendPoint[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT.brand} stopOpacity={0.22} />
              <stop offset="100%" stopColor={ACCENT.brand} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(v: number) => [`${v} cases`, "Violations"]}
            contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, padding: "6px 10px" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={ACCENT.brand}
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 3.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
