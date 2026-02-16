"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TopAreasChart({
  data,
}: {
  data: Array<{ area: string; artists: number }>;
}) {
  return (
    <div className="h-[420px] w-full rounded-xl border border-black/10 p-3 dark:border-white/10">
      <h2 className="mb-3 text-sm font-semibold text-black/70 dark:text-white/80">
Top area IDs by artist count
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="area"
            width={200}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <Tooltip />
          <Bar dataKey="artists" fill="#f4c430" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
