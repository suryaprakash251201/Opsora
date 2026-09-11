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
        "group card-glass gradient-border shine-on-hover relative flex min-h-[112px] flex-col gap-2 overflow-hidden rounded-[12px] p-4",
        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_color-mix(in_oklab,var(--accent)_45%,transparent)]",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: accent }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-2 text-xs">
          <span
            className="flex size-6 items-center justify-center rounded-md"
            style={{
              background: `color-mix(in oklab, ${accent} 14%, transparent)`,
              color: accent,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 25%, transparent)`,
            }}
          >
            <Icon className="size-3.5" strokeWidth={2.2} />
          </span>
          {label}
        </span>
        <StatusDot status={status} />
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <span className="metrics text-[22px] leading-none font-semibold tracking-tight">
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

      <p className="text-subtle relative truncate text-[11px]">{footer}</p>
    </Link>
  );
}

function TileSkeleton() {
  return (
    <Skeleton className="card-glass h-[104px] rounded-[12px] border border-[var(--border)]/60" />
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