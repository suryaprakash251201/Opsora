import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import type { CalendarSnapshot } from "@/lib/mock/calendar";
import type { DockerSnapshot } from "@/lib/mock/docker";
import type { GithubSnapshot } from "@/lib/mock/github";
import type { PiholeSnapshot } from "@/lib/mock/pihole";
import type { ServersSnapshot } from "@/lib/mock/servers";
import type { Todo } from "@/features/todos/types";
import { formatBytes, formatNumber } from "@/lib/format";
import type { AttentionItem, Severity } from "./types";

export interface AttentionInput {
  servers?: ServersSnapshot;
  github?: GithubSnapshot;
  pihole?: PiholeSnapshot;
  docker?: DockerSnapshot;
  calendar?: CalendarSnapshot;
  todos?: Todo[];
  now?: Date;
}

type DraftItem = Omit<AttentionItem, "score"> & { urgency?: number };

const SEVERITY_BASE: Record<Severity, number> = {
  critical: 100,
  warning: 70,
  info: 40,
  success: 10,
};

const PRIORITY_WEIGHT: Record<Todo["priority"], number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/* ------------------------------------------------------------------ */
/* Rules: servers                                                      */
/* ------------------------------------------------------------------ */

function serverItems(snapshot: ServersSnapshot, now: Date): DraftItem[] {
  const items: DraftItem[] = [];

  for (const server of snapshot.servers) {
    if (!server.online) {
      const offlineHours = Math.max(
        0,
        differenceInHours(now, parseISO(server.updatedAt)),
      );
      items.push({
        id: `server-offline-${server.id}`,
        source: "servers",
        severity: "critical",
        title: `${server.name} is unreachable`,
        detail: `Last heartbeat ${offlineHours}h ago · ${server.host}`,
        href: "/servers",
        createdAt: server.updatedAt,
        context: server.role,
        meta: "offline",
        urgency: Math.min(offlineHours, 12),
      });
      continue;
    }

    for (const disk of server.disks) {
      const percent = (disk.usedBytes / disk.totalBytes) * 100;
      if (percent < 80) continue;

      const free = disk.totalBytes - disk.usedBytes;
      items.push({
        id: `server-disk-${server.id}-${disk.mount}`,
        source: "servers",
        severity: percent >= 90 ? "critical" : "warning",
        title:
          percent >= 90
            ? `${server.name} disk ${disk.mount} at ${percent.toFixed(0)}%`
            : `${server.name} disk ${disk.mount} filling up`,
        detail: `${formatBytes(free)} free of ${formatBytes(disk.totalBytes)}`,
        href: "/servers",
        createdAt: server.updatedAt,
        context: server.host,
        meta: `${percent.toFixed(0)}%`,
        urgency: Math.min((percent - 80) / 2, 15),
      });
    }

    if (server.cpu.usage >= 80) {
      items.push({
        id: `server-cpu-${server.id}`,
        source: "servers",
        severity: server.cpu.usage >= 90 ? "critical" : "warning",
        title: `${server.name} CPU at ${server.cpu.usage.toFixed(0)}%`,
        detail: `Load ${server.cpu.load1} · ${server.cpu.cores} cores`,
        href: "/servers",
        createdAt: server.updatedAt,
        context: server.host,
        meta: `${server.cpu.usage.toFixed(0)}%`,
        urgency: Math.min((server.cpu.usage - 80) / 2, 15),
      });
    }

    const memoryPercent =
      (server.memory.usedBytes / server.memory.totalBytes) * 100;
    if (memoryPercent >= 85) {
      items.push({
        id: `server-memory-${server.id}`,
        source: "servers",
        severity: memoryPercent >= 95 ? "critical" : "warning",
        title: `${server.name} memory at ${memoryPercent.toFixed(0)}%`,
        detail: `${formatBytes(server.memory.usedBytes)} of ${formatBytes(server.memory.totalBytes)} used`,
        href: "/servers",
        createdAt: server.updatedAt,
        context: server.host,
        meta: `${memoryPercent.toFixed(0)}%`,
      });
    }

    if (server.cpu.temperatureC >= 75) {
      items.push({
        id: `server-temp-${server.id}`,
        source: "servers",
        severity: "warning",
        title: `${server.name} running hot`,
        detail: `${server.cpu.temperatureC.toFixed(0)}°C package temperature`,
        href: "/servers",
        createdAt: server.updatedAt,
        context: server.host,
        meta: `${server.cpu.temperatureC.toFixed(0)}°C`,
      });
    }

    for (const service of server.services) {
      if (service.status !== "degraded") continue;

      items.push({
        id: `server-service-${server.id}-${service.name}`,
        source: "servers",
        severity: "warning",
        title: `${service.label} degraded on ${server.name}`,
        detail: "Service is responding but failing health checks",
        href: "/servers",
        createdAt: server.updatedAt,
        context: server.host,
        meta: "degraded",
      });
    }
  }

  return items;
}

/* ------------------------------------------------------------------ */
/* Rules: GitHub                                                       */
/* ------------------------------------------------------------------ */

function githubItems(snapshot: GithubSnapshot, now: Date): DraftItem[] {
  const items: DraftItem[] = [];

  for (const repo of snapshot.repos) {
    if (repo.ci.status === "failing") {
      const age = Math.max(0, differenceInHours(now, parseISO(repo.ci.at)));
      items.push({
        id: `github-ci-${repo.id}`,
        source: "github",
        severity: "critical",
        title: `${repo.name} CI failed`,
        detail: `${repo.ci.workflow} · ${age}h ago on ${repo.defaultBranch}`,
        href: "/github",
        createdAt: repo.ci.at,
        context: repo.description,
        meta: "CI",
        urgency: Math.min(age, 10),
      });
    }

    if (repo.deployment.status === "failed") {
      items.push({
        id: `github-deploy-${repo.id}`,
        source: "github",
        severity: "critical",
        title: `${repo.name} deployment failed`,
        detail: `Environment ${repo.deployment.environment}`,
        href: "/github",
        createdAt: repo.deployment.at,
        context: repo.description,
        meta: "deploy",
      });
    } else if (repo.deployment.status === "in_progress") {
      items.push({
        id: `github-deploy-progress-${repo.id}`,
        source: "github",
        severity: "info",
        title: `Deploying ${repo.name} to ${repo.deployment.environment}`,
        detail: "Deployment is in progress",
        href: "/github",
        createdAt: repo.deployment.at,
        context: repo.description,
        meta: "deploy",
      });
    }
  }

  for (const pull of snapshot.pulls) {
    if (!pull.reviewRequested || pull.draft) continue;

    const age = Math.max(0, differenceInHours(now, parseISO(pull.createdAt)));
    items.push({
      id: `github-review-${pull.repo}-${pull.id}`,
      source: "github",
      severity: "warning",
      title: `PR #${pull.id} needs your review`,
      detail: `${pull.title} · +${pull.additions} −${pull.deletions}`,
      href: "/github",
      createdAt: pull.createdAt,
      context: pull.repo,
      meta: `#${pull.id}`,
      urgency: Math.min(age / 2, 10),
    });
  }

  for (const issue of snapshot.issues) {
    const isHighPriority = issue.labels.some((label) =>
      label.includes("priority"),
    );
    if (!isHighPriority) continue;

    const age = Math.max(0, differenceInHours(now, parseISO(issue.createdAt)));
    if (age < 12) continue;

    items.push({
      id: `github-issue-${issue.repo}-${issue.id}`,
      source: "github",
      severity: "info",
      title: `High-priority issue #${issue.id} open for ${Math.floor(age / 24)}d`,
      detail: issue.title,
      href: "/github",
      createdAt: issue.createdAt,
      context: issue.repo,
      meta: `#${issue.id}`,
    });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/* Rules: Pi-hole                                                      */
/* ------------------------------------------------------------------ */

function piholeItems(snapshot: PiholeSnapshot, now: Date): DraftItem[] {
  const items: DraftItem[] = [];
  const { summary } = snapshot;

  if (summary.upstreamStatus === "down") {
    items.push({
      id: "pihole-upstream-down",
      source: "pihole",
      severity: "critical",
      title: "Pi-hole upstream DNS is down",
      detail: "All queries are failing · check unbound",
      href: "/pihole",
      createdAt: snapshot.updatedAt,
      context: "ceres.lan",
      meta: "DNS",
    });
  } else if (summary.upstreamStatus === "degraded") {
    items.push({
      id: "pihole-upstream-degraded",
      source: "pihole",
      severity: "warning",
      title: "Pi-hole upstream DNS is degraded",
      detail: "Elevated response times on upstream resolvers",
      href: "/pihole",
      createdAt: snapshot.updatedAt,
      context: "ceres.lan",
      meta: "DNS",
    });
  }

  if (summary.blockRate >= 30) {
    items.push({
      id: "pihole-block-rate",
      source: "pihole",
      severity: summary.blockRate >= 40 ? "critical" : "warning",
      title: `Block rate at ${summary.blockRate.toFixed(1)}%`,
      detail: `${formatNumber(summary.blocked)} of ${formatNumber(summary.queries)} queries blocked today`,
      href: "/pihole",
      createdAt: snapshot.updatedAt,
      context: "ceres.lan",
      meta: `${summary.blockRate.toFixed(1)}%`,
    });
  }

  const [top, ...rest] = [...snapshot.topClients].sort(
    (a, b) => b.queries - a.queries,
  );
  const baseline = median(rest.map((client) => client.queries));
  if (top && baseline > 0) {
    const ratio = top.queries / baseline;
    if (ratio >= 3) {
      items.push({
        id: `pihole-client-${top.ip}`,
        source: "pihole",
        severity: "warning",
        title: `${top.name} DNS traffic ${ratio.toFixed(1)}× above baseline`,
        detail: `${formatNumber(top.queries)} queries vs ${formatNumber(Math.round(baseline))} median`,
        href: "/pihole",
        createdAt: snapshot.updatedAt,
        context: top.ip,
        meta: `${ratio.toFixed(1)}×`,
        urgency: Math.min(ratio, 10),
      });
    }
  }

  const gravityAge = differenceInHours(now, parseISO(summary.gravityUpdatedAt));
  if (gravityAge > 7 * 24) {
    items.push({
      id: "pihole-gravity-stale",
      source: "pihole",
      severity: "info",
      title: `Gravity list is ${Math.floor(gravityAge / 24)} days old`,
      detail: "Update blocklists from the Pi-hole admin UI",
      href: "/pihole",
      createdAt: summary.gravityUpdatedAt,
      context: "ceres.lan",
      meta: "gravity",
    });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/* Rules: Docker                                                       */
/* ------------------------------------------------------------------ */

function dockerItems(snapshot: DockerSnapshot): DraftItem[] {
  const items: DraftItem[] = [];

  for (const container of snapshot.containers) {
    if (container.health === "unhealthy") {
      items.push({
        id: `docker-unhealthy-${container.id}`,
        source: "docker",
        severity: "critical",
        title: `${container.name} is unhealthy`,
        detail: `${container.image} · health check failing`,
        href: "/docker",
        createdAt: snapshot.updatedAt,
        context: container.ports !== "-" ? `ports ${container.ports}` : undefined,
        meta: "health",
      });
      continue;
    }

    if (
      container.state === "running" &&
      container.health === "starting" &&
      container.restarts24h >= 3
    ) {
      items.push({
        id: `docker-restarts-${container.id}`,
        source: "docker",
        severity: "warning",
        title: `${container.name} restarted ${container.restarts24h} times in 24h`,
        detail: `${container.image} · still starting`,
        href: "/docker",
        createdAt: snapshot.updatedAt,
        context: `ports ${container.ports}`,
        meta: `${container.restarts24h}×`,
        urgency: container.restarts24h,
      });
      continue;
    }

    if (container.restarts24h >= 2) {
      items.push({
        id: `docker-restart-info-${container.id}`,
        source: "docker",
        severity: "info",
        title: `${container.name} restarted ${container.restarts24h} times in 24h`,
        detail: container.image,
        href: "/docker",
        createdAt: snapshot.updatedAt,
        context: `ports ${container.ports}`,
        meta: `${container.restarts24h}×`,
      });
    }
  }

  return items;
}

/* ------------------------------------------------------------------ */
/* Rules: Calendar                                                     */
/* ------------------------------------------------------------------ */

function calendarItems(snapshot: CalendarSnapshot, now: Date): DraftItem[] {
  const upcoming = snapshot.events
    .filter((event) => !event.allDay)
    .map((event) => ({
      event,
      minutes: differenceInMinutes(parseISO(event.start), now),
    }))
    .filter(({ minutes }) => minutes >= -15 && minutes <= 180)
    .sort((a, b) => a.minutes - b.minutes);

  const next = upcoming[0];
  if (!next) return [];

  const inProgress = next.minutes <= 0;
  const minutes = Math.abs(next.minutes);
  const when =
    minutes < 1
      ? "now"
      : minutes < 60
        ? `in ${minutes}m`
        : `in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  return [
    {
      id: `calendar-${next.event.id}`,
      source: "calendar",
      severity: "info",
      title: inProgress ? `${next.event.title} is happening now` : next.event.title,
      detail: inProgress
        ? `Started ${minutes}m ago${next.event.location ? ` · ${next.event.location}` : ""}`
        : `Starts ${when}${next.event.location ? ` · ${next.event.location}` : ""}`,
      href: "/calendar",
      createdAt: new Date(
        parseISO(next.event.start).getTime() - 15 * 60_000,
      ).toISOString(),
      context: next.event.calendar,
      meta: inProgress ? "now" : when,
      urgency: Math.max(0, 20 - minutes / 10),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Rules: Todos                                                        */
/* ------------------------------------------------------------------ */

function todoItems(todos: Todo[], now: Date): DraftItem[] {
  const items: DraftItem[] = [];
  const open = todos.filter((todo) => todo.status !== "done");
  const today = startOfDay(now);

  const overdue = open.filter(
    (todo) => todo.dueDate && parseISO(todo.dueDate) < today,
  );
  if (overdue.length > 0) {
    const maxDays = Math.max(
      ...overdue.map((todo) =>
        Math.max(
          0,
          differenceInDays(now, parseISO(todo.dueDate ?? now.toISOString())),
        ),
      ),
    );
    items.push({
      id: "todos-overdue",
      source: "todos",
      severity: "warning",
      title: `${overdue.length} task${overdue.length > 1 ? "s" : ""} overdue`,
      detail: overdue
        .slice(0, 2)
        .map((todo) => todo.title)
        .join(" · "),
      href: "/todos",
      createdAt: overdue[0].dueDate ?? now.toISOString(),
      context: "todos",
      meta: maxDays > 0 ? `${maxDays}d` : "today",
      urgency: Math.min(maxDays * 2, 15),
    });
  }

  const dueToday = open.filter(
    (todo) => todo.dueDate && isToday(parseISO(todo.dueDate)),
  );
  if (dueToday.length > 0) {
    const weight = Math.max(
      ...dueToday.map((todo) => PRIORITY_WEIGHT[todo.priority]),
    );
    items.push({
      id: "todos-due-today",
      source: "todos",
      severity: weight >= 2 ? "warning" : "info",
      title: `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`,
      detail: dueToday
        .slice(0, 2)
        .map((todo) => todo.title)
        .join(" · "),
      href: "/todos",
      createdAt: now.toISOString(),
      context: "todos",
      meta: "today",
      urgency: weight * 2,
    });
  }

  const waiting = open.filter(
    (todo) =>
      todo.status === "waiting" &&
      differenceInDays(now, parseISO(todo.createdAt)) >= 3,
  );
  if (waiting.length > 0) {
    items.push({
      id: "todos-waiting",
      source: "todos",
      severity: "info",
      title: `${waiting.length} task${waiting.length > 1 ? "s" : ""} waiting for 3+ days`,
      detail: waiting
        .slice(0, 2)
        .map((todo) => todo.title)
        .join(" · "),
      href: "/todos",
      createdAt: waiting[0].createdAt,
      context: "todos",
      meta: "waiting",
    });
  }

  const completedToday = todos.filter(
    (todo) =>
      todo.status === "done" &&
      todo.completedAt &&
      parseISO(todo.completedAt) >= today,
  );
  if (completedToday.length > 0) {
    items.push({
      id: "todos-completed",
      source: "todos",
      severity: "success",
      title: `${completedToday.length} task${completedToday.length > 1 ? "s" : ""} completed today`,
      detail: "Keep going",
      href: "/todos",
      createdAt: completedToday[0].completedAt ?? now.toISOString(),
      context: "todos",
      meta: "done",
    });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export function evaluateAttention(input: AttentionInput): AttentionItem[] {
  const now = input.now ?? new Date();

  const drafts: DraftItem[] = [
    ...(input.servers ? serverItems(input.servers, now) : []),
    ...(input.github ? githubItems(input.github, now) : []),
    ...(input.pihole ? piholeItems(input.pihole, now) : []),
    ...(input.docker ? dockerItems(input.docker) : []),
    ...(input.calendar ? calendarItems(input.calendar, now) : []),
    ...(input.todos ? todoItems(input.todos, now) : []),
  ];

  return drafts
    .map(({ urgency = 0, ...item }) => ({
      ...item,
      score: Math.round((SEVERITY_BASE[item.severity] + urgency) * 10) / 10,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.createdAt.localeCompare(a.createdAt),
    );
}

export interface AttentionSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  success: number;
  needsAttention: number;
}

export function summarizeAttention(
  items: AttentionItem[],
): AttentionSummary {
  const summary: AttentionSummary = {
    total: items.length,
    critical: 0,
    warning: 0,
    info: 0,
    success: 0,
    needsAttention: 0,
  };

  for (const item of items) {
    summary[item.severity] += 1;
  }

  summary.needsAttention = summary.critical + summary.warning;
  return summary;
}

export function overallHealth(
  items: AttentionItem[],
): "critical" | "warning" | "healthy" {
  if (items.some((item) => item.severity === "critical")) return "critical";
  if (items.some((item) => item.severity === "warning")) return "warning";
  return "healthy";
}
