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
import { HistoryLineChart, QueriesChart } from "@/components/viz/charts";
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
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {insights.map((insight) => {
              const meta = severityMeta[insight.tone as InsightTone];
              const Icon = toneIcon[insight.tone as InsightTone];

              return (
                <article
                  key={insight.id}
                  className="border-border bg-panel rounded-card flex items-start gap-3 border p-4"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border",
                      meta.bg,
                      meta.border,
                      meta.text,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-medium">
                        {insight.title}
                      </h3>
                      {insight.metric ? (
                        <span
                          className={cn(
                            "metrics shrink-0 text-xs font-medium",
                            meta.text,
                          )}
                        >
                          {insight.metric}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted mt-1 text-xs leading-relaxed">
                      {insight.detail}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {sourceLabels[insight.source]}
                    </Badge>
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
                    <CardTitle>CPU · {atlas.name} (48 samples)</CardTitle>
                    <span className="text-subtle metrics text-xs">
                      {atlas.cpu.usage}% now
                    </span>
                  </CardHeader>
                  <CardContent className="pt-2">
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
