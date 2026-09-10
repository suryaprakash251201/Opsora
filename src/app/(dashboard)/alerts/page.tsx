"use client";

import { useMemo, useState } from "react";
import { BellOff } from "lucide-react";
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

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              filter === item.value
                ? "border-border-strong bg-surface text-foreground"
                : "text-muted hover:bg-surface/60 hover:text-foreground border-transparent",
            )}
          >
            {item.label}
            <span className="metrics text-subtle">{counts[item.value]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={
            filter === "attention"
              ? "Nothing needs attention"
              : "No alerts in this category"
          }
          description="Systems look healthy. New signals will appear here as they arrive."
        />
      ) : (
        <div className="border-border bg-panel rounded-card flex flex-col gap-0.5 border p-1.5">
          {filtered.map((item) => (
            <AttentionRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
