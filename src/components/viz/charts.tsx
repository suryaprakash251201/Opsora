"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PiholeHistoryPoint } from "@/lib/types/pihole";

const tooltipStyle = {
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
} as const;

const axisTick = { fill: "var(--subtle)", fontSize: 11 } as const;

/** Placeholder shown when a chart has no samples yet (e.g. server restart,
 *  offline agent, or an unconfigured source) instead of a blank grid. */
function ChartEmpty({ height, message }: { height: number; message: string }) {
  return (
    <div
      className="border-border/60 text-subtle flex items-center justify-center rounded-lg border border-dashed px-4 text-center text-xs leading-relaxed"
      style={{ height }}
      role="img"
      aria-label={message}
    >
      {message}
    </div>
  );
}

export function QueriesChart({ data }: { data: PiholeHistoryPoint[] }) {
  if (data.length === 0) {
    return (
      <ChartEmpty
        height={230}
        message="No DNS history yet — the chart fills in as queries arrive."
      />
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: format(parseISO(point.time), "HH:mm"),
  }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="queriesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--info)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="var(--border)"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          interval={3}
        />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--muted)" }} />
        <Area
          type="monotone"
          dataKey="queries"
          name="Queries"
          stroke="var(--info)"
          strokeWidth={2}
          fill="url(#queriesFill)"
        />
        <Bar
          dataKey="blocked"
          name="Blocked"
          fill="var(--danger)"
          opacity={0.75}
          barSize={5}
          radius={[2, 2, 0, 0]}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HistoryLineChart({
  data,
  color = "var(--info)",
  unit = "%",
  max,
}: {
  data: number[];
  color?: string;
  unit?: string;
  max?: number;
}) {
  if (data.length === 0) {
    return (
      <ChartEmpty
        height={180}
        message="No samples yet — trends build while the agent is online."
      />
    );
  }

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
      >
        <CartesianGrid
          stroke="var(--border)"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis dataKey="index" hide />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={44}
          domain={[0, max ?? "auto"]}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={() => ""}
          formatter={(value) => [`${value}${unit}`, ""]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
