"use client";

import { useMemo, useState } from "react";
import { LiveBell } from "@/components/icons/live";
import { PageHeader } from "@/components/viz/page-header";
import { EmptyState } from "@/components/viz/section";
import { StatTile } from "@/components/viz/stat-tile";
import { AttentionRow } from "@/components/viz/attention-row";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttention } from "@/hooks/use-attention";
import type { Severity } from "@/lib/attention/types";
import { cn } from "@/lib/utils";

type Filter = "attention" | Severity | "all";

const filters: { value: Filter; label: string }[] = [
  { value: "attention", label: "Needs attention" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "all", label: "All" },
];

export default function AlertsPage() {
  const { items, summary, isLoading } = useAttention();
  const [filter, setFilter] = useState<Filter>("attention");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "attention")
      return items.filter(
        (item) =>
          item.severity === "critical" || item.severity === "warning",
      );
    return items.filter((item) => item.severity === filter);
  }, [items, filter]);

  const counts: Record<Filter, number> = {
    attention: summary.needsAttention,
    critical: summary.critical,
    warning: summary.warning,
    info: summary.info,
    success: summary.success,
    all: summary.total,
  };

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Every signal in one place, ranked by what needs you first."
        accent="var(--accent-alerts)"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Critical"
          value={summary.critical}
          accent="var(--danger)"
        />
        <StatTile
          label="Warning"
          value={summary.warning}
          accent="var(--warning)"
        />
        <StatTile label="Info" value={summary.info} accent="var(--info)" />
        <StatTile
          label="Success"
          value={summary.success}
          accent="var(--success)"
        />
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto p-1 bg-surface/50 border border-border/60 rounded-2xl backdrop-blur-sm">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer",
              filter === item.value
                ? "bg-panel text-foreground shadow-xs border border-border/80"
                : "text-muted hover:text-foreground hover:bg-surface/80 border border-transparent",
            )}
          >
            {item.label}
            {counts[item.value] > 0 ? (
              <span
                className={cn(
                  "metrics rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  filter === item.value
                    ? "bg-surface text-foreground"
                    : "bg-surface/80 text-subtle",
                )}
              >
                {counts[item.value]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LiveBell}
          title={
            filter === "attention"
              ? "Nothing needs attention"
              : "No alerts in this category"
          }
          description="Systems look healthy. New signals will appear here as they arrive."
        />
      ) : (
        <div className="card-elevated flex flex-col gap-1 rounded-2xl border border-border/80 p-2 shadow-xs">
          {filtered.map((item) => (
            <AttentionRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
