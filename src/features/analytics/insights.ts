import type { SnapshotBundle } from "@/lib/adapters/types";
import type { SourceId } from "@/lib/attention/types";
import { formatBytes, formatNumber } from "@/lib/format";

export type InsightTone = "critical" | "warning" | "info" | "success";

export interface Insight {
  id: string;
  tone: InsightTone;
  source: SourceId;
  title: string;
  detail: string;
  metric?: string;
}

const toneRank: Record<InsightTone, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
};

export function generateInsights(sources: SnapshotBundle): Insight[] {
  const insights: Insight[] = [];
  const { servers, pihole, github, docker } = sources;

  /* Servers */
  for (const server of servers.data.servers) {
    if (!server.online) continue;

    for (const disk of server.disks) {
      const percent = (disk.usedBytes / disk.totalBytes) * 100;
      if (percent < 80) continue;
      insights.push({
        id: `insight-disk-${server.id}-${disk.mount}`,
        tone: percent >= 90 ? "critical" : "warning",
        source: "servers",
        title: `${server.name} ${disk.mount} is at ${percent.toFixed(0)}%`,
        detail:
          percent >= 90
            ? `Only ${formatBytes(disk.totalBytes - disk.usedBytes)} left. Prune Docker images, old snapshots, and logs to buy space.`
            : `${formatBytes(disk.totalBytes - disk.usedBytes)} remaining. Cleanup within the next week is recommended.`,
        metric: `${percent.toFixed(0)}%`,
      });
    }

    if (server.cpu.temperatureC >= 70) {
      insights.push({
        id: `insight-temp-${server.id}`,
        tone: "info",
        source: "servers",
        title: `${server.name} is running warm`,
        detail: `Package temperature of ${server.cpu.temperatureC.toFixed(0)}°C under load. Check airflow or fan curves.`,
        metric: `${server.cpu.temperatureC.toFixed(0)}°C`,
      });
    }
  }

  /* Pi-hole */
  const { summary, topClients, topBlocked } = pihole.data;
  insights.push({
    id: "insight-blockrate",
    tone: summary.blockRate >= 30 ? "warning" : "info",
    source: "pihole",
    title: `Pi-hole blocked ${summary.blockRate.toFixed(1)}% of DNS requests`,
    detail: `${formatNumber(summary.blocked)} of ${formatNumber(summary.queries)} requests blocked today across ${summary.clients} clients.`,
    metric: `${summary.blockRate.toFixed(1)}%`,
  });

  const [topClient, ...otherClients] = [...topClients].sort(
    (a, b) => b.queries - a.queries,
  );
  if (topClient && otherClients.length > 0) {
    const total = topClients.reduce((sum, client) => sum + client.queries, 0);
    const share = (topClient.queries / total) * 100;
    insights.push({
      id: "insight-top-client",
      tone: share >= 35 ? "warning" : "info",
      source: "pihole",
      title: `${topClient.name} drives ${share.toFixed(0)}% of DNS traffic`,
      detail: `${formatNumber(topClient.queries)} queries from ${topClient.ip} today. ${share >= 35 ? "Well above the household baseline." : "In line with recent activity."}`,
      metric: `${share.toFixed(0)}%`,
    });
  }

  if (topBlocked[0]) {
    insights.push({
      id: "insight-top-blocked",
      tone: "info",
      source: "pihole",
      title: `${topBlocked[0].domain} is the top blocked domain`,
      detail: `${formatNumber(topBlocked[0].count)} requests blocked today. Three domains account for most of the blocklist hits.`,
      metric: formatNumber(topBlocked[0].count),
    });
  }

  /* GitHub */
  const failingRepos = github.data.repos.filter(
    (repo) => repo.ci.status === "failing",
  );
  if (failingRepos.length > 0) {
    insights.push({
      id: "insight-ci",
      tone: "critical",
      source: "github",
      title: `${failingRepos.length} failing workflow${failingRepos.length > 1 ? "s" : ""} on ${failingRepos.map((repo) => repo.name).join(", ")}`,
      detail: `Latest run: ${failingRepos[0].ci.workflow}. Fix the failing checks before the next deploy.`,
      metric: "CI",
    });
  } else {
    insights.push({
      id: "insight-ci-ok",
      tone: "success",
      source: "github",
      title: "All workflows are passing",
      detail: `${github.data.repos.length} repositories checked, no failing runs on the default branches.`,
      metric: "CI",
    });
  }

  insights.push({
    id: "insight-commits",
    tone: "info",
    source: "github",
    title: `${github.data.stats.commitsToday} commits pushed today`,
    detail: `${github.data.stats.openPulls} pull requests open · ${github.data.stats.openIssues} issues awaiting triage.`,
    metric: String(github.data.stats.commitsToday),
  });

  const reviewPulls = github.data.pulls.filter(
    (pull) => pull.reviewRequested && !pull.draft,
  );
  if (reviewPulls.length > 0) {
    insights.push({
      id: "insight-reviews",
      tone: "warning",
      source: "github",
      title: `${reviewPulls.length} pull request${reviewPulls.length > 1 ? "s" : ""} waiting on your review`,
      detail: reviewPulls
        .map((pull) => `#${pull.id} ${pull.title}`)
        .join(" · "),
      metric: "review",
    });
  }

  /* Docker */
  const restarted = docker.data.containers
    .filter((container) => container.restarts24h > 0)
    .sort((a, b) => b.restarts24h - a.restarts24h);
  if (restarted.length > 0) {
    insights.push({
      id: "insight-restarts",
      tone: restarted[0].restarts24h >= 3 ? "warning" : "info",
      source: "docker",
      title: `${docker.data.summary.restarts24h} container restarts in the last 24h`,
      detail: restarted
        .map(
          (container) => `${container.name} (${container.restarts24h}×)`,
        )
        .join(" · "),
      metric: `${docker.data.summary.restarts24h}×`,
    });
  }

  insights.push({
    id: "insight-container-memory",
    tone: "info",
    source: "docker",
    title: `Containers are using ${formatBytes(docker.data.summary.memoryUsedMb * 1024 * 1024)}`,
    detail: `${docker.data.summary.running} containers running · ${docker.data.summary.unhealthy} unhealthy · ${docker.data.summary.stopped} stopped.`,
    metric: formatBytes(docker.data.summary.memoryUsedMb * 1024 * 1024),
  });

  return insights.sort(
    (a, b) => toneRank[a.tone] - toneRank[b.tone] || a.title.localeCompare(b.title),
  );
}
