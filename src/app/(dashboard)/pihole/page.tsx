"use client";

import {
  Ban,
  Globe,
  Network,
  Plug,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/viz/page-header";
import { EmptyConfigHint, ErrorState } from "@/components/viz/section";
import { SourceWarning } from "@/components/viz/source-warning";
import { StatTile } from "@/components/viz/stat-tile";
import { StatusDot } from "@/components/viz/status-dot";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueriesChart } from "@/components/viz/charts-lazy";
import { REFETCH_INTERVALS, useSourceSnapshot } from "@/hooks/use-snapshot";
import { formatNumber, formatPercent, timeAgo } from "@/lib/format";

function TopList({
  items,
  valueLabel,
  tone,
}: {
  items: { label: string; sub?: string; value: number }[];
  valueLabel: string;
  tone: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={item.label} className="group/item flex flex-col gap-1.5 rounded-xl border border-border/50 bg-surface/30 p-2.5 transition-colors hover:bg-surface/60">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-4.5 shrink-0 items-center justify-center rounded-md bg-surface text-subtle text-[10px] font-mono font-bold">
                {index + 1}
              </span>
              <span className="truncate font-medium text-foreground text-[12.5px]">{item.label}</span>
            </div>
            <span className="metrics text-foreground font-semibold shrink-0 text-xs">
              {formatNumber(item.value)}{" "}
              <span className="text-subtle font-normal text-[11px]">{valueLabel}</span>
            </span>
          </div>
          <div className="bg-surface/80 h-1.5 overflow-hidden rounded-full border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-300 ${tone}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          {item.sub ? (
            <span className="text-subtle font-mono text-[10.5px] pl-6.5">{item.sub}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function PiholePage() {
  const { data, isLoading, isError, refetch, isFetching } = useSourceSnapshot("pihole", REFETCH_INTERVALS.pihole);

  const snapshot = data?.data;
  const isUnconfigured =
    data?.mode === "empty" &&
    snapshot !== undefined &&
    snapshot.summary.queries === 0 &&
    snapshot.history.length === 0;

  return (
    <>
      <PageHeader
        title="Pi-hole"
        accent="var(--accent-pihole)"
        description={
          snapshot && !isUnconfigured
            ? `${formatNumber(snapshot.summary.domains)} domains on blocklist · gravity updated ${timeAgo(snapshot.summary.gravityUpdatedAt)}`
            : "DNS queries, blocks, clients and upstream health"
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "animate-spin" : undefined} />
            Refresh
          </Button>
        }
      />

      <SourceWarning snapshot={data} className="mb-4" />

      {isError ? (
        <ErrorState
          title="Could not reach Pi-hole"
          onRetry={() => void refetch()}
        />
      ) : isLoading || !snapshot ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-[92px]" />
          ))}
        </div>
      ) : isUnconfigured ? (
        <EmptyConfigHint
          icon={Plug}
          accent="var(--accent-pihole)"
          title="Connect Pi-hole"
          description="Opsora speaks the Pi-hole v6 admin API. The dashboard needs the admin URL and password to pull queries, blocks, top clients and the gravity list — everything stays on the server."
          env={["PIHOLE_URL", "PIHOLE_PASSWORD"]}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="DNS queries"
              value={formatNumber(snapshot.summary.queries)}
              icon={Globe}
              accent="var(--info)"
            />
            <StatTile
              label="Blocked"
              value={formatNumber(snapshot.summary.blocked)}
              icon={Ban}
              accent="var(--danger)"
              footer={`${formatPercent(snapshot.summary.blockRate, 1)} block rate`}
            />
            <StatTile
              label="Active clients"
              value={snapshot.summary.clients}
              icon={Users}
              accent="var(--accent-pihole)"
            />
            <StatTile
              label="Upstream DNS"
              value={
                <span className="flex items-center gap-2 text-base font-semibold">
                  <StatusDot
                    status={
                      snapshot.summary.upstreamStatus === "healthy"
                        ? "healthy"
                        : snapshot.summary.upstreamStatus === "degraded"
                          ? "warning"
                          : "critical"
                    }
                  />
                  {snapshot.summary.upstreamStatus}
                </span>
              }
              icon={Network}
              accent="var(--brand)"
              footer={`${snapshot.summary.latencyMs} ms average latency`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <Zap className="text-subtle size-3.5" />
                Queries · last 24 hours
              </CardTitle>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-muted flex items-center gap-1.5">
                  <span className="bg-info size-2 rounded-full" /> Queries
                </span>
                <span className="text-muted flex items-center gap-1.5">
                  <span className="bg-danger size-2 rounded-full" /> Blocked
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <QueriesChart data={snapshot.history} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Users className="text-subtle size-3.5" />
                  Top clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopList
                  items={snapshot.topClients.map((client) => ({
                    label: client.name,
                    sub: client.ip,
                    value: client.queries,
                  }))}
                  valueLabel="queries"
                  tone="bg-info/70"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Ban className="text-subtle size-3.5" />
                  Top blocked domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopList
                  items={snapshot.topBlocked.map((domain) => ({
                    label: domain.domain,
                    value: domain.count,
                  }))}
                  valueLabel="blocks"
                  tone="bg-danger/70"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <ShieldCheck className="text-subtle size-3.5" />
                Most requested domains
              </CardTitle>
              <Badge variant="success">allowed</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {snapshot.topPermitted.map((domain) => (
                  <div
                    key={domain.domain}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="truncate">{domain.domain}</span>
                    <span className="metrics text-subtle shrink-0">
                      {formatNumber(domain.count)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
