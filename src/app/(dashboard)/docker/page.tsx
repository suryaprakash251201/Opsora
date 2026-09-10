"use client";

import { Boxes, Container, RefreshCw, RotateCw, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/viz/page-header";
import { ErrorState } from "@/components/viz/section";
import { SourceWarning } from "@/components/viz/source-warning";
import { StatTile } from "@/components/viz/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSourceSnapshot } from "@/hooks/use-snapshot";
import { formatBytes, formatDuration, timeAgo } from "@/lib/format";
import type { DockerContainer } from "@/lib/mock/docker";
import { cn } from "@/lib/utils";

function stateVariant(container: DockerContainer) {
  if (container.state === "restarting") return "warning" as const;
  if (container.state === "exited") return "default" as const;
  return "success" as const;
}

function healthVariant(health: DockerContainer["health"]) {
  if (health === "healthy") return "success" as const;
  if (health === "unhealthy") return "danger" as const;
  if (health === "starting") return "warning" as const;
  return "outline" as const;
}

export default function DockerPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSourceSnapshot(
    "docker",
    45_000,
  );

  const snapshot = data?.data;
  const containers = snapshot
    ? [...snapshot.containers].sort((a, b) => {
        if (a.state === b.state) return a.name.localeCompare(b.name);
        return a.state === "running" ? -1 : 1;
      })
    : [];

  return (
    <>
      <PageHeader
        title="Docker"
        description={
          snapshot
            ? `${snapshot.summary.running} running · ${snapshot.summary.images} images · updated ${timeAgo(snapshot.updatedAt)}`
            : "Containers, health, resource usage and restarts"
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
          title="Could not reach the Docker socket"
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
              label="Running"
              value={snapshot.summary.running}
              icon={Container}
            />
            <StatTile
              label="Stopped"
              value={snapshot.summary.stopped}
              icon={Boxes}
            />
            <StatTile
              label="Unhealthy"
              value={snapshot.summary.unhealthy}
              icon={TriangleAlert}
            />
            <StatTile
              label="Restarts · 24h"
              value={snapshot.summary.restarts24h}
              icon={RotateCw}
              footer={`${formatBytes(snapshot.summary.memoryUsedMb * 1024 * 1024)} in use`}
            />
          </div>

          <div className="border-border bg-panel rounded-card overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead>
                  <tr className="border-border/70 text-subtle border-b text-[11px] tracking-wide uppercase">
                    <th className="px-4 py-2.5 font-medium">Container</th>
                    <th className="px-3 py-2.5 font-medium">State</th>
                    <th className="px-3 py-2.5 font-medium">Health</th>
                    <th className="px-3 py-2.5 text-right font-medium">CPU</th>
                    <th className="px-3 py-2.5 font-medium">Memory</th>
                    <th className="px-3 py-2.5 text-right font-medium">Uptime</th>
                    <th className="px-4 py-2.5 text-right font-medium">
                      Restarts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((container) => {
                    const memoryPercent =
                      container.memoryLimitMb > 0
                        ? (container.memoryMb / container.memoryLimitMb) * 100
                        : 0;

                    return (
                      <tr
                        key={container.id}
                        className="border-border/50 hover:bg-surface/40 border-b transition-colors last:border-0"
                      >
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{container.name}</p>
                          <p className="text-subtle font-mono text-[10px]">
                            {container.image}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={stateVariant(container)}>
                            {container.state}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {container.health === "none" ? (
                            <span className="text-subtle">—</span>
                          ) : (
                            <Badge variant={healthVariant(container.health)}>
                              {container.health}
                            </Badge>
                          )}
                        </td>
                        <td className="metrics px-3 py-2.5 text-right">
                          {container.state === "running"
                            ? `${container.cpu}%`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          {container.state === "running" ? (
                            <div className="flex w-36 flex-col gap-1">
                              <span className="metrics text-[10px]">
                                {formatBytes(container.memoryMb * 1024 * 1024)} /{" "}
                                {formatBytes(
                                  container.memoryLimitMb * 1024 * 1024,
                                )}
                              </span>
                              <div className="bg-surface h-1 overflow-hidden rounded-full">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    memoryPercent > 85
                                      ? "bg-warning"
                                      : "bg-info/70",
                                  )}
                                  style={{ width: `${memoryPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </td>
                        <td className="metrics text-subtle px-3 py-2.5 text-right">
                          {container.state === "running"
                            ? formatDuration(container.uptimeSeconds)
                            : "—"}
                        </td>
                        <td
                          className={cn(
                            "metrics px-4 py-2.5 text-right",
                            container.restarts24h >= 2 && "text-warning",
                          )}
                        >
                          {container.restarts24h}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
