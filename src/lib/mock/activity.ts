import type { SourceId } from "@/lib/attention/types";
import { hoursAgo, minutesAgo } from "@/lib/mock/random";

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

export function getActivityFeed(): ActivityEvent[] {
  const now = Date.now();

  const events: ActivityEvent[] = [
    {
      id: "evt-1",
      source: "github",
      kind: "commit",
      title: "Pushed to cloud-dock",
      detail: "a3f91c2 · feat(storage): add R2 multipart upload support",
      at: minutesAgo(2, now),
    },
    {
      id: "evt-2",
      source: "docker",
      kind: "docker",
      title: "nginx restarted",
      detail: "Restart #2 in the last 24 hours on atlas",
      at: minutesAgo(26, now),
    },
    {
      id: "evt-3",
      source: "github",
      kind: "ci",
      title: "CI failed on cloud-dock",
      detail: "ci.yml · test — 3 failed, 118 passed",
      at: minutesAgo(38, now),
    },
    {
      id: "evt-4",
      source: "pihole",
      kind: "dns",
      title: "Pi-hole blocked a spike",
      detail: "214 requests to ads.tracker.io in 5 minutes",
      at: minutesAgo(64, now),
    },
    {
      id: "evt-5",
      source: "servers",
      kind: "backup",
      title: "Backup completed on atlas",
      detail: "cloud-dock snapshots · 184 GB in 27m",
      at: hoursAgo(2.1, now),
    },
    {
      id: "evt-6",
      source: "github",
      kind: "deploy",
      title: "Deployed cloud-dock to production",
      detail: "v0.4.2 · success",
      at: hoursAgo(3.4, now),
    },
    {
      id: "evt-7",
      source: "servers",
      kind: "server",
      title: "vega became unreachable",
      detail: "Last heartbeat 2h ago · Tailscale reports node offline",
      at: hoursAgo(2.4, now),
    },
    {
      id: "evt-8",
      source: "github",
      kind: "release",
      title: "Released backend-api v0.9.0",
      detail: "Tagged on develop · staging",
      at: hoursAgo(4.2, now),
    },
    {
      id: "evt-9",
      source: "pihole",
      kind: "dns",
      title: "Gravity updated",
      detail: "185,204 domains on blocklist",
      at: hoursAgo(5.2, now),
    },
    {
      id: "evt-10",
      source: "docker",
      kind: "docker",
      title: "Postgres healthy check passed",
      detail: "12 containers running · 0 unhealthy",
      at: hoursAgo(6, now),
    },
  ];

  return events.sort((a, b) => b.at.localeCompare(a.at));
}
