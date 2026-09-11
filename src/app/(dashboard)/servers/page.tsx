"use client";

import { RefreshCw, Terminal } from "lucide-react";
import { LiveServer } from "@/components/icons/live";
import { PageHeader } from "@/components/viz/page-header";
import { EmptyConfigHint, ErrorState, SectionHeader } from "@/components/viz/section";
import { SourceWarning } from "@/components/viz/source-warning";
import { StatTile } from "@/components/viz/stat-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerCard } from "@/features/servers/server-card";
import { REFETCH_INTERVALS, useSourceSnapshot } from "@/hooks/use-snapshot";
import { formatBytes, timeAgo } from "@/lib/format";

export default function ServersPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSourceSnapshot(
    "servers",
    REFETCH_INTERVALS.servers,
  );

  const snapshot = data?.data;
  const isUnconfigured =
    data?.mode === "empty" && snapshot !== undefined && snapshot.servers.length === 0;

  return (
    <>
      <PageHeader
        title="Servers"
        accent="var(--accent-servers)"
        description={
          snapshot && !isUnconfigured
            ? `${snapshot.summary.online}/${snapshot.summary.total} online · updated ${timeAgo(snapshot.updatedAt)}`
            : "Linux agent metrics — CPU, memory, disks, services"
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
          title="Could not reach the agent"
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
          icon={Terminal}
          accent="var(--accent-servers)"
          title="Start the Opsora agent"
          description="Run the dependency-free Node script on each host you want to monitor. It reads /proc, runs df / ps / systemctl, and POSTs a compact JSON snapshot to the dashboard every 30s. There is nothing to install besides Node 22+."
          env={["OPSORA_URL", "OPSORA_AGENT_TOKEN", "OPSORA_SERVICES"]}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Online"
              value={`${snapshot.summary.online}/${snapshot.summary.total}`}
            />
            <StatTile
              label="Average CPU"
              value={`${snapshot.summary.cpuAvg}%`}
            />
            <StatTile
              label="Total memory"
              value={formatBytes(snapshot.summary.memoryUsedBytes)}
              unit={`of ${formatBytes(snapshot.summary.memoryTotalBytes)}`}
            />
            <StatTile
              label="Average disk"
              value={`${snapshot.summary.diskAvg}%`}
            />
          </div>

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Machines"
              icon={LiveServer}
              description="Metrics refresh every 30 seconds"
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {snapshot.servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
