"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

/**
 * Recharts is ~100kB gzip — too heavy for the initial bundle. The Pi-hole and
 * Analytics pages lazy-load the chart wrappers via next/dynamic so the rest of
 * the dashboard stays snappy.
 */
const QueriesChart = dynamic(
  () => import("@/components/viz/charts").then((m) => m.QueriesChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-shimmer w-full rounded-md"
        style={{ height: 230 }}
        aria-hidden
      />
    ),
  },
);

const HistoryLineChart = dynamic(
  () => import("@/components/viz/charts").then((m) => m.HistoryLineChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-shimmer w-full rounded-md"
        style={{ height: 180 }}
        aria-hidden
      />
    ),
  },
);

export { QueriesChart, HistoryLineChart };
export type QueriesChartProps = ComponentProps<typeof QueriesChart>;
export type HistoryLineChartProps = ComponentProps<typeof HistoryLineChart>;
