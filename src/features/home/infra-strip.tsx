"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  LiveDocker,
  LiveGithub,
  LiveServer,
  LiveShield,
  type LiveIconProps,
} from "@/components/icons/live";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/viz/sparkline";
import { StatusDot, type DotStatus } from "@/components/viz/status-dot";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";
import { formatBytes, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TileProps {
  href: string;
  icon: ComponentType<LiveIconProps>;
  label: string;
  value: string;
  status: DotStatus;
  footer: string;
  spark?: number[];
  sparkClassName?: string;
  accent: string;
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
  accent,
}: TileProps) {
  return (
    <Link
      href={href}
      style={{ ["--accent" as string]: accent } as React.CSSProperties}
      className={cn(
        "kpi-card group relative flex min-h-[116px] flex-col justify-between overflow-hidden rounded-xl p-4.5",
        "transition-all duration-200 hover:-translate-y-1 hover:border-border-strong",
      )}
    >
      {/* Top accent glow line */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
        style={{
          background: accent,
          boxShadow: `0 1px 8px ${accent}`,
        }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-2.5 text-xs font-semibold tracking-tight">
          <span
            className="flex size-7 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105"
            style={{
              background: `color-mix(in oklab, ${accent} 16%, transparent)`,
              borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
              color: accent,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 20%, transparent)`,
            }}
          >
            <Icon className="size-4" strokeWidth={2.2} />
          </span>
          <span className="text-foreground/90">{label}</span>
        </span>
        <StatusDot status={status} pulse={status !== "healthy"} />
      </div>

      <div className="relative mt-2 flex items-end justify-between gap-3">
        <span className="metrics text-[24px] leading-none font-bold tracking-tight text-foreground">
          {value}
        </span>
        {spark && spark.length > 1 ? (
          <Sparkline
            data={spark}
            height={28}
            stroke={accent}
            className={cn("h-7 w-20 shrink-0", sparkClassName)}
          />
        ) : null}
      </div>

      <p className="text-subtle relative mt-1.5 truncate text-[11px] font-medium">{footer}</p>
    </Link>
  );
}

function TileSkeleton() {
  return (
    <Skeleton className="h-[104px] rounded-[12px] border border-[var(--border)]/60 bg-panel" />
  );
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
        icon={LiveServer}
        label="Linux"
        value={`${serverSnap.summary.online}/${serverSnap.summary.total}`}
        status={
          serverSnap.summary.online === serverSnap.summary.total
            ? "healthy"
            : "critical"
        }
        footer={`CPU ${serverSnap.summary.cpuAvg}% · RAM ${formatBytes(serverSnap.summary.memoryUsedBytes)}`}
        spark={
          primaryServer
            ? primaryServer.history.cpu.length > 1
              ? primaryServer.history.cpu
              : primaryServer.history.memory
            : undefined
        }
        accent="var(--accent-servers)"
      />

      <Tile
        href="/pihole"
        icon={LiveShield}
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
        accent="var(--accent-pihole)"
      />

      <Tile
        href="/docker"
        icon={LiveDocker}
        label="Docker"
        value={`${dockerSnap.summary.running} running`}
        status={dockerSnap.summary.unhealthy > 0 ? "critical" : "healthy"}
        footer={`${dockerSnap.summary.unhealthy} unhealthy · ${dockerSnap.summary.restarts24h} restarts 24h`}
        spark={dockerSnap.containers
          .filter((container) => container.state === "running")
          .map((container) => container.cpu)}
        accent="var(--accent-docker)"
      />

      <Tile
        href="/github"
        icon={LiveGithub}
        label="GitHub"
        value={`${githubSnap.stats.openPulls} open PRs`}
        status={worstCi}
        footer={`${githubSnap.stats.openIssues} issues · ${githubSnap.stats.commitsToday} commits today`}
        accent="var(--accent-github)"
      />
    </div>
  );
}