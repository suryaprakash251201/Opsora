import { createRandom, hoursAgo, oscillate, round } from "@/lib/mock/random";

export interface PiholeHistoryPoint {
  time: string;
  queries: number;
  blocked: number;
}

export interface PiholeSnapshot {
  summary: {
    queries: number;
    blocked: number;
    blockRate: number;
    clients: number;
    domains: number;
    upstreamStatus: "healthy" | "degraded" | "down";
    latencyMs: number;
    gravityUpdatedAt: string;
  };
  history: PiholeHistoryPoint[];
  topClients: { name: string; ip: string; queries: number }[];
  topBlocked: { domain: string; count: number }[];
  topPermitted: { domain: string; count: number }[];
  updatedAt: string;
}

const random = createRandom(4242);

const clients = [
  { name: "tv-living-room", ip: "192.168.1.42" },
  { name: "surya-macbook", ip: "192.168.1.21" },
  { name: "iphone", ip: "192.168.1.34" },
  { name: "work-laptop", ip: "192.168.1.57" },
  { name: "nas", ip: "192.168.1.10" },
  { name: "atlas", ip: "192.168.1.2" },
  { name: "esp32-sensors", ip: "192.168.1.88" },
];

const blockedDomains = [
  "ads.tracker.io",
  "metrics.example-cdn.com",
  "doubleclick.net",
  "app-measurement.com",
  "graph.facebook.com",
  "telemetry.samsung.com",
  "ads.youtube.com",
];

const permittedDomains = [
  "github.com",
  "1.1.1.1",
  "registry.npmjs.org",
  "api.github.com",
  "deb.debian.org",
  "raw.githubusercontent.com",
];

export function getPiholeSnapshot(): PiholeSnapshot {
  const now = Date.now();

  const history: PiholeHistoryPoint[] = [];
  for (let hoursBack = 23; hoursBack >= 0; hoursBack -= 1) {
    const isPeak = hoursBack >= 3 && hoursBack <= 8;
    const isNight = hoursBack >= 14 && hoursBack <= 18;
    const base = isPeak ? 2450 : isNight ? 760 : 1680;
    const queries = round(oscillate(base, base * 0.12, 90_000, hoursBack, now), 0);
    const rate = random.between(0.18, 0.24) + (hoursBack === 2 ? 0.05 : 0);
    history.push({
      time: new Date(now - hoursBack * 3_600_000).toISOString(),
      queries,
      blocked: Math.round(queries * rate),
    });
  }

  const queries = history.reduce((total, point) => total + point.queries, 0);
  const blocked = history.reduce((total, point) => total + point.blocked, 0);

  const clientQueries = [13500, 5120, 4380, 3940, 2810, 2140, 1120].map(
    (value, index) =>
      index === 0
        ? Math.round(value * (1 + 0.15 * Math.sin(now / 45_000)))
        : Math.round(value * (1 + 0.08 * Math.sin(now / 60_000 + index))),
  );

  return {
    summary: {
      queries,
      blocked,
      blockRate: round((blocked / queries) * 100, 1),
      clients: 14,
      domains: 1842,
      upstreamStatus: "healthy",
      latencyMs: round(oscillate(18, 4, 70_000, 0.5, now)),
      gravityUpdatedAt: hoursAgo(5.2, now),
    },
    history,
    topClients: clients.map((client, index) => ({
      ...client,
      queries: clientQueries[index],
    })),
    topBlocked: blockedDomains.map((domain, index) => ({
      domain,
      count: Math.round(920 - index * 118 + random.between(-40, 40)),
    })),
    topPermitted: permittedDomains.map((domain, index) => ({
      domain,
      count: Math.round(1420 - index * 160 + random.between(-50, 50)),
    })),
    updatedAt: new Date(now).toISOString(),
  };
}
