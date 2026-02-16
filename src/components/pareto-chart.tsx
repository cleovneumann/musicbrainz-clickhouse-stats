"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ParetoChart({
  data,
}: {
  data: Array<{ rank: number; area: string; artists: number; cumulative_pct: number }>;
}) {
  return (
    <div className="h-[360px] w-full rounded-xl border border-black/10 p-3 dark:border-white/10">
      <h2 className="mb-3 text-sm font-semibold text-black/70 dark:text-white/80">
        Pareto by area (artist concentration)
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rank" label={{ value: "Area rank", position: "insideBottom", offset: -2 }} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
          <Tooltip />
          <Bar yAxisId="left" dataKey="artists" fill="#22c55e" radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative_pct"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
