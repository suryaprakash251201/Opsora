"use client";

import { useMemo } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/viz/page-header";
import { severityMeta } from "@/components/viz/severity";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HistoryLineChart,
  QueriesChart,
} from "@/components/viz/charts-lazy";
import { generateInsights, type InsightTone } from "@/features/analytics/insights";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneIcon = {
  critical: TriangleAlert,
  warning: CircleAlert,
  info: Info,
  success: CircleCheck,
} as const;

const sourceLabels = {
  servers: "Servers",
  github: "GitHub",
  pihole: "Pi-hole",
  docker: "Docker",
  calendar: "Calendar",
  todos: "Todos",
} as const;

export default function AnalyticsPage() {
  const { data, isLoading } = useDashboardSnapshot();

  const insights = useMemo(
    () => (data ? generateInsights(data.sources) : []),
    [data],
  );

  const atlas =
    data?.sources.servers.data.servers.find((server) => server.id === "atlas") ??
    data?.sources.servers.data.servers[0];

  return (
    <>
      <PageHeader
        title="Analytics"
        accent="var(--accent-analytics)"
        description={
          data
            ? `${insights.length} insights · derived ${timeAgo(data.fetchedAt)}`
            : "Rule-based insights across your systems"
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
            {insights.map((insight) => {
              const meta = severityMeta[insight.tone as InsightTone];
              const Icon = toneIcon[insight.tone as InsightTone];

              return (
                <article
                  key={insight.id}
                  className="card-elevated group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-border/80 p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-2 left-0 w-1 rounded-r-full",
                      meta.dot,
                    )}
                  />
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-xs transition-transform duration-200 group-hover:scale-105",
                      meta.bg,
                      meta.border,
                      meta.text,
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13.5px] font-bold text-foreground tracking-tight">
                        {insight.title}
                      </h3>
                      {insight.metric ? (
                        <span
                          className={cn(
                            "metrics shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tracking-tight",
                            meta.bg,
                            meta.text,
                          )}
                        >
                          {insight.metric}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted mt-1 text-xs leading-relaxed font-normal">
                      {insight.detail}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Badge variant="outline" className="border-border/60 bg-surface/50 text-[10.5px] font-medium">
                        {sourceLabels[insight.source]}
                      </Badge>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-[13px] font-medium">
              <Sparkles className="text-subtle size-3.5" />
              Trends
            </h2>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {atlas ? (
                <Card>
                  <CardHeader>
                    <CardTitle>CPU · {atlas.name}</CardTitle>
                    <span className="text-subtle metrics text-xs">
                      {atlas.history.cpu.length > 0
                        ? `${atlas.history.cpu.length} samples`
                        : atlas.online
                          ? "collecting samples…"
                          : "no samples"}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-subtle mb-2 text-[11px]">
                      {atlas.online
                        ? `${atlas.cpu.usage}% now`
                        : `offline · last known ${atlas.cpu.usage}%`}
                    </p>
                    <HistoryLineChart
                      data={atlas.history.cpu}
                      color="var(--info)"
                      max={100}
                    />
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>DNS queries · 24h</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <QueriesChart data={data.sources.pihole.data.history} />
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
