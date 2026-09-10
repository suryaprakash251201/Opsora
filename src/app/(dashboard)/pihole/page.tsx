"use client";

import {
  Ban,
  Globe,
  Network,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/viz/page-header";
import { ErrorState } from "@/components/viz/section";
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
import { QueriesChart } from "@/components/viz/charts";
import { useSourceSnapshot } from "@/hooks/use-snapshot";
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
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate">{item.label}</span>
            <span className="metrics text-subtle shrink-0">
              {formatNumber(item.value)} {valueLabel}
            </span>
          </div>
          <div className="bg-surface h-1.5 overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full ${tone}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          {item.sub ? (
            <span className="text-subtle font-mono text-[10px]">{item.sub}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function PiholePage() {
  const { data, isLoading, isError, refetch, isFetching } = useSourceSnapshot(
    "pihole",
    60_000,
  );

  const snapshot = data?.data;

  return (
    <>
      <PageHeader
        title="Pi-hole"
        description={
          snapshot
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
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="DNS queries"
              value={formatNumber(snapshot.summary.queries)}
              icon={Globe}
            />
            <StatTile
              label="Blocked"
              value={formatNumber(snapshot.summary.blocked)}
              icon={Ban}
              footer={`${formatPercent(snapshot.summary.blockRate, 1)} block rate`}
            />
            <StatTile
              label="Clients"
              value={snapshot.summary.clients}
              icon={Users}
            />
            <StatTile
              label="Upstream"
              value={
                <span className="flex items-center gap-2 text-base">
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
