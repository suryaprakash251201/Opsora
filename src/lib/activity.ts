import type { SourceId } from "@/lib/attention/types";
import type { SnapshotBundle } from "@/lib/adapters/types";

export type ActivityKind =
  | "commit"
  | "ci"
  | "deploy"
  | "docker"
  | "dns"
  | "server"
  | "backup"
  | "release"
  | "todo";

export interface ActivityEvent {
  id: string;
  source: SourceId;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: string;
}

/** Shows recent activity only for sources that are actually live. */
export function getActivityFeed(sources: SnapshotBundle): ActivityEvent[] {
  const feed: ActivityEvent[] = [];
  const now = Date.now();

  if (sources.github.status !== "error") {
    for (const event of sources.github.data.activity) {
      feed.push({
        id: `gh-${event.id}`,
        source: "github",
        kind: event.kind === "commit" ? "commit" : ("ci" as ActivityKind),
        title: event.repo,
        detail: event.text,
        at: event.at,
      });
    }
  }

  if (sources.docker.status !== "error") {
    const restarted = sources.docker.data.containers.filter(
      (container) => container.restarts24h > 0,
    );
    for (const container of restarted) {
      feed.push({
        id: `docker-${container.id}`,
        source: "docker",
        kind: "docker",
        title: `${container.name} restarted`,
        detail: `${container.restarts24h}× in the last 24h · ${container.image}`,
        at: new Date(now - container.restarts24h * 3_600_000).toISOString(),
      });
    }
  }

  if (sources.pihole.status !== "error") {
    const { gravityUpdatedAt, domains } = sources.pihole.data.summary;
    if (gravityUpdatedAt) {
      feed.push({
        id: "pihole-gravity",
        source: "pihole",
        kind: "dns",
        title: "Gravity updated",
        detail: `${domains.toLocaleString()} domains on blocklist`,
        at: gravityUpdatedAt,
      });
    }
  }

  for (const server of sources.servers.data.servers) {
    feed.push({
      id: `server-${server.id}`,
      source: "servers",
      kind: "server",
      title: server.online ? `${server.name} reported in` : `${server.name} offline`,
      detail: server.online
        ? `CPU ${server.cpu.usage}% · uptime ${Math.round(server.uptimeSeconds / 3600)}h`
        : `Last seen ${server.updatedAt}`,
      at: server.updatedAt,
    });
  }

  return feed.sort((a, b) => b.at.localeCompare(a.at));
}
