"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Container,
  Server,
  ShieldCheck,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/github";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/viz/sparkline";
import { StatusDot, type DotStatus } from "@/components/viz/status-dot";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";
import { formatBytes, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TileProps {
  href: string;
  icon: LucideIcon | typeof GitHubIcon;
  label: string;
  value: string;
  status: DotStatus;
  footer: string;
  spark?: number[];
  sparkClassName?: string;
}

function Tile({
  href,
  icon: Icon,
  label,
  value,
  status,
  footer,
  spark,
  sparkClassName,
}: TileProps) {
  return (
    <Link
      href={href}
      className="border-border bg-panel rounded-card hover:border-border-strong flex flex-col gap-2 border p-3.5 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-1.5 text-xs">
          <Icon className="text-subtle size-3.5" />
          {label}
        </span>
        <StatusDot status={status} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="metrics text-xl leading-none font-semibold tracking-tight">
          {value}
        </span>
        {spark && spark.length > 1 ? (
          <Sparkline
            data={spark}
            height={24}
            className={cn("text-subtle h-6 w-16 shrink-0", sparkClassName)}
          />
        ) : null}
      </div>

      <p className="text-subtle truncate text-xs">{footer}</p>
    </Link>
  );
}

function TileSkeleton() {
  return <Skeleton className="h-[104px] rounded-[10px]" />;
}

export function InfraStrip() {
  const { data, isLoading } = useDashboardSnapshot();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <TileSkeleton key={index} />
        ))}
      </div>
    );
  }

  const { servers, pihole, docker, github } = data.sources;
  const serverSnap = servers.data;
  const piholeSnap = pihole.data;
  const dockerSnap = docker.data;
  const githubSnap = github.data;

  const primaryServer =
    serverSnap.servers.find((server) => server.online) ?? serverSnap.servers[0];

  const worstCi = githubSnap.repos.some((repo) => repo.ci.status === "failing")
    ? "critical"
    : githubSnap.repos.some((repo) => repo.ci.status === "running")
      ? "warning"
      : "healthy";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        href="/servers"
        icon={Server}
        label="Linux"
        value={`${serverSnap.summary.online}/${serverSnap.summary.total}`}
        status={
          serverSnap.summary.online === serverSnap.summary.total
            ? "healthy"
            : "critical"
        }
        footer={`CPU ${serverSnap.summary.cpuAvg}% · RAM ${formatBytes(serverSnap.summary.memoryUsedBytes)}`}
        spark={primaryServer?.history.cpu}
        sparkClassName="text-info"
      />

      <Tile
        href="/pihole"
        icon={ShieldCheck}
        label="Pi-hole"
        value={formatNumber(piholeSnap.summary.queries)}
        status={
          piholeSnap.summary.upstreamStatus === "healthy"
            ? "healthy"
            : piholeSnap.summary.upstreamStatus === "degraded"
              ? "warning"
              : "critical"
        }
        footer={`${piholeSnap.summary.blockRate}% blocked · ${formatNumber(piholeSnap.summary.blocked)} blocked`}
        spark={piholeSnap.history.map((point) => point.queries)}
        sparkClassName="text-warning"
      />

      <Tile
        href="/docker"
        icon={Container}
        label="Docker"
        value={`${dockerSnap.summary.running} running`}
        status={dockerSnap.summary.unhealthy > 0 ? "critical" : "healthy"}
        footer={`${dockerSnap.summary.unhealthy} unhealthy · ${dockerSnap.summary.restarts24h} restarts 24h`}
        spark={dockerSnap.containers
          .filter((container) => container.state === "running")
          .map((container) => container.cpu)}
        sparkClassName="text-success"
      />

      <Tile
        href="/github"
        icon={GitHubIcon}
        label="GitHub"
        value={`${githubSnap.stats.openPulls} open PRs`}
        status={worstCi}
        footer={`${githubSnap.stats.openIssues} issues · ${githubSnap.stats.commitsToday} commits today`}
      />
    </div>
  );
}
