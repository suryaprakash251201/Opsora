"use client";

import { Boxes, Plug, RefreshCw, RotateCw, TriangleAlert } from "lucide-react";
import { LiveDocker } from "@/components/icons/live";
import { PageHeader } from "@/components/viz/page-header";
import { EmptyConfigHint, ErrorState } from "@/components/viz/section";
import { SourceWarning } from "@/components/viz/source-warning";
import { StatTile } from "@/components/viz/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { REFETCH_INTERVALS, useSourceSnapshot } from "@/hooks/use-snapshot";
import { formatBytes, formatDuration, timeAgo } from "@/lib/format";
import type { DockerContainer } from "@/lib/types/docker";
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
  const { data, isLoading, isError, refetch, isFetching } = useSourceSnapshot("docker", REFETCH_INTERVALS.docker);

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
        accent="var(--accent-docker)"
        description={
          snapshot && containers.length > 0
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
      ) : containers.length === 0 ? (
        <EmptyConfigHint
          icon={Plug}
          accent="var(--accent-docker)"
          title="Connect the Docker socket"
          description="Opsora talks directly to the Docker Engine via its unix socket. Make sure /var/run/docker.sock is reachable (Opsora's user must be in the docker group) and that OPSORA_DOCKER isn't set to 0. Inside the Docker image, mount the socket at /var/run/docker.sock."
          env={["DOCKER_SOCKET", "OPSORA_DOCKER"]}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Running"
              value={snapshot.summary.running}
              icon={LiveDocker}
              accent="var(--success)"
            />
            <StatTile
              label="Stopped"
              value={snapshot.summary.stopped}
              icon={Boxes}
              accent="var(--muted)"
            />
            <StatTile
              label="Unhealthy"
              value={snapshot.summary.unhealthy}
              icon={TriangleAlert}
              accent={snapshot.summary.unhealthy > 0 ? "var(--danger)" : "var(--muted)"}
            />
            <StatTile
              label="Restarts · 24h"
              value={snapshot.summary.restarts24h}
              icon={RotateCw}
              accent={snapshot.summary.restarts24h > 0 ? "var(--warning)" : "var(--muted)"}
              footer={`${formatBytes(snapshot.summary.memoryUsedMb * 1024 * 1024)} in use`}
            />
          </div>

          <div className="card-elevated overflow-hidden rounded-2xl border border-border/80 shadow-xs">
            <div className="border-b border-border/70 bg-surface/40 px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-[13.5px] font-semibold text-foreground tracking-tight">Active Containers</h3>
                <p className="text-subtle text-xs">Live socket metrics from Docker daemon</p>
              </div>
              <Badge variant="outline" className="metrics text-xs font-semibold">
                {containers.length} total
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-surface/30 text-subtle text-[11px] font-semibold tracking-wider uppercase">
                    <th className="px-4 py-3">Container</th>
                    <th className="px-3 py-3">State</th>
                    <th className="px-3 py-3">Health</th>
                    <th className="px-3 py-3 text-right">CPU</th>
                    <th className="px-3 py-3">Memory</th>
                    <th className="px-3 py-3 text-right">Uptime</th>
                    <th className="px-4 py-3 text-right">Restarts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {containers.map((container) => {
                    const memoryPercent =
                      container.memoryLimitMb > 0
                        ? (container.memoryMb / container.memoryLimitMb) * 100
                        : 0;

                    return (
                      <tr
                        key={container.id}
                        className="hover:bg-surface/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                container.state === "running" ? "bg-success" : "bg-subtle",
                              )}
                            />
                            <div>
                              <p className="font-semibold text-[13px] text-foreground">{container.name}</p>
                              <p className="text-subtle font-mono text-[10.5px]">
                                {container.image}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={stateVariant(container)} className="font-semibold uppercase text-[10px]">
                            {container.state}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          {container.health === "none" ? (
                            <span className="text-subtle text-xs">—</span>
                          ) : (
                            <Badge variant={healthVariant(container.health)} className="font-semibold uppercase text-[10px]">
                              {container.health}
                            </Badge>
                          )}
                        </td>
                        <td className="metrics px-3 py-3 text-right font-medium text-foreground">
                          {container.state === "running"
                            ? `${container.cpu}%`
                            : "—"}
                        </td>
                        <td className="px-3 py-3">
                          {container.state === "running" ? (
                            <div className="flex w-36 flex-col gap-1.5">
                              <span className="metrics text-[10.5px] font-medium text-foreground">
                                {formatBytes(container.memoryMb * 1024 * 1024)} /{" "}
                                {formatBytes(
                                  container.memoryLimitMb * 1024 * 1024,
                                )}
                              </span>
                              <div className="bg-surface h-1.5 overflow-hidden rounded-full border border-border/50">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    memoryPercent > 85
                                      ? "bg-warning"
                                      : "bg-info/80",
                                  )}
                                  style={{ width: `${Math.min(memoryPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </td>
                        <td className="metrics text-subtle px-3 py-3 text-right font-medium">
                          {container.state === "running"
                            ? formatDuration(container.uptimeSeconds)
                            : "—"}
                        </td>
                        <td
                          className={cn(
                            "metrics px-4 py-3 text-right font-semibold",
                            container.restarts24h >= 2 ? "text-warning" : "text-subtle",
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
