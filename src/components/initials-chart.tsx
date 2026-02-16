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

export function InitialsChart({
  data,
}: {
  data: Array<{ initial: string; artists: number }>;
}) {
  return (
    <div className="h-[320px] w-full rounded-xl border border-black/10 p-3 dark:border-white/10">
      <h2 className="mb-3 text-sm font-semibold text-black/70 dark:text-white/80">
        Most common artist initials
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="initial" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="artists" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
