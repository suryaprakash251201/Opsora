"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Container, Server, ShieldCheck } from "lucide-react";
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
      className="group relative overflow-hidden rounded-[10px] border p-3.5 transition-all"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklab, ${accent} 6%, transparent) 0%, transparent 60%), var(--panel)`,
          borderColor: "var(--border)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
        style={{ background: accent }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-1.5 text-xs">
          <Icon
            className="size-3.5 transition-transform group-hover:scale-110"
            style={{ color: accent }}
          />
          {label}
        </span>
        <StatusDot status={status} />
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <span className="metrics text-xl leading-none font-semibold tracking-tight">
          {value}
        </span>
        {spark && spark.length > 1 ? (
          <Sparkline
            data={spark}
            height={24}
            stroke={accent}
            className={cn("h-6 w-16 shrink-0", sparkClassName)}
          />
        ) : null}
      </div>

      <p className="text-subtle relative truncate text-xs">{footer}</p>
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
        accent="var(--accent-servers)"
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
        accent="var(--accent-pihole)"
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
        accent="var(--accent-docker)"
      />

      <Tile
        href="/github"
        icon={GitHubIcon}
        label="GitHub"
        value={`${githubSnap.stats.openPulls} open PRs`}
        status={worstCi}
        footer={`${githubSnap.stats.openIssues} issues · ${githubSnap.stats.commitsToday} commits today`}
        accent="var(--accent-github)"
      />
    </div>
  );
}
