import type { Snapshot, SourceAdapter } from "@/lib/adapters/types";
import type { PiholeHistoryPoint, PiholeSnapshot } from "@/lib/types/pihole";

const CACHE_TTL_MS = 30_000;

function num(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return "";
}

function list(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  return [];
}

function unwrap(
  payload: unknown,
  keys: string[],
): Record<string, unknown>[] {
  if (Array.isArray(payload)) return list(payload);
  if (typeof payload !== "object" || payload === null) return [];

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return list(value);
    if (typeof value === "object" && value !== null) {
      return Object.entries(value).map(([k, v]) => ({
        name: k,
        count: v,
      }));
    }
  }
  return [];
}

export function mapPiholeSummary(
  summary: Record<string, unknown>,
  now = Date.now(),
): PiholeSnapshot["summary"] {
  const queries = (summary.queries ?? {}) as Record<string, unknown>;
  const clients = (summary.clients ?? {}) as Record<string, unknown>;
  const gravity = (summary.gravity ?? {}) as Record<string, unknown>;

  const total = num(
    queries.total,
    summary.dns_queries_today,
    summary.queries_total,
  );
  const blocked = num(
    queries.blocked,
    summary.ads_blocked_today,
    summary.queries_blocked,
  );
  const percent = num(
    queries.percent_blocked,
    summary.ads_percentage_today,
  );
  const gravityLastUpdate = num(
    gravity.last_update,
    summary.gravity_last_updated,
  );

  return {
    queries: total,
    blocked,
    blockRate:
      percent > 0
        ? Number(percent.toFixed(1))
        : total > 0
          ? Number(((blocked / total) * 100).toFixed(1))
          : 0,
    clients: num(clients.active, summary.active_clients, summary.clients),
    domains: num(gravity.domains_being_blocked, summary.domains_being_blocked),
    upstreamStatus: "healthy",
    latencyMs: 0,
    gravityUpdatedAt:
      gravityLastUpdate > 0
        ? new Date(gravityLastUpdate * 1000).toISOString()
        : new Date(now).toISOString(),
  };
}

export function mapPiholeHistory(payload: unknown): PiholeHistoryPoint[] {
  return unwrap(payload, ["history"]).map((point) => {
    const timestamp = num(point.timestamp, point.time);
    return {
      time: new Date(timestamp * 1000).toISOString(),
      queries: num(point.total, point.queries, point.count),
      blocked: num(point.blocked, point.ads, point.blocked_queries),
    };
  });
}

export function mapTopClients(
  payload: unknown,
): PiholeSnapshot["topClients"] {
  return unwrap(payload, ["clients", "top_clients"])
    .slice(0, 8)
    .map((client) => ({
      name: str(client.name, client.client, client.ip) || "unknown",
      ip: str(client.ip, client.address) || "-",
      queries: num(client.count, client.queries, client.total),
    }));
}

export function mapTopDomains(
  payload: unknown,
): PiholeSnapshot["topBlocked"] {
  return unwrap(payload, ["domains", "top_domains"])
    .slice(0, 8)
    .map((domain) => ({
      domain: str(domain.domain, domain.name) || "unknown",
      count: num(domain.count, domain.queries, domain.total),
    }));
}

interface Session {
  sid: string;
  csrf: string;
  expiresAt: number;
}

interface PiholeClient {
  api<T>(path: string): Promise<T>;
}

function createPiholeClient(baseUrl: string, password: string): PiholeClient {
  const base = baseUrl.replace(/\/$/, "");
  let session: Session | null = null;

  async function authenticate(): Promise<Session> {
    if (session && Date.now() < session.expiresAt - 30_000) return session;

    const response = await fetch(`${base}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Pi-hole authentication failed with ${response.status}`,
      );
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const raw = (payload.session ?? payload) as Record<string, unknown>;
    const sid = str(raw.sid);
    if (!sid) throw new Error("Pi-hole did not return a session id");

    session = {
      sid,
      csrf: str(raw.csrf),
      expiresAt: Date.now() + num(raw.validity, 300) * 1000,
    };
    return session;
  }

  async function api<T>(path: string): Promise<T> {
    const active = await authenticate();
    const headers = {
      accept: "application/json",
      "X-FTL-SID": active.sid,
    };
    const response = await fetch(`${base}${path}`, {
      headers,
      cache: "no-store",
    });

    if (response.status === 401) {
      session = null;
      const retried = await authenticate();
      const retryResponse = await fetch(`${base}${path}`, {
        headers: {
          accept: "application/json",
          "X-FTL-SID": retried.sid,
        },
        cache: "no-store",
      });
      if (!retryResponse.ok) {
        throw new Error(`Pi-hole ${path} responded with ${retryResponse.status}`);
      }
      return retryResponse.json() as Promise<T>;
    }

    if (!response.ok) {
      throw new Error(`Pi-hole ${path} responded with ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  return { api };
}

async function fetchPiholeSnapshot(
  client: PiholeClient,
): Promise<PiholeSnapshot> {
  const started = Date.now();
  const [summary, history, blocked, permitted, clients] = await Promise.all([
    client.api<Record<string, unknown>>("/api/stats/summary"),
    client
      .api<unknown>("/api/stats/history")
      .catch(() => client.api<unknown>("/api/history"))
      .catch(() => null),
    client
      .api<unknown>("/api/stats/top_domains?blocked=true&count=8")
      .catch(() => null),
    client
      .api<unknown>("/api/stats/top_domains?blocked=false&count=8")
      .catch(() => null),
    client
      .api<unknown>("/api/stats/top_clients?count=8")
      .catch(() => null),
  ]);

  const mappedSummary = mapPiholeSummary(summary);
  mappedSummary.latencyMs = Date.now() - started;

  return {
    summary: mappedSummary,
    history: history ? mapPiholeHistory(history) : [],
    topClients: clients ? mapTopClients(clients) : [],
    topBlocked: blocked ? mapTopDomains(blocked) : [],
    topPermitted: permitted ? mapTopDomains(permitted) : [],
    updatedAt: new Date().toISOString(),
  };
}

export function createPiholeAdapter(
  baseUrl: string,
  password: string,
): SourceAdapter<PiholeSnapshot> {
  const client = createPiholeClient(baseUrl, password);
  let cache: { at: number; data: PiholeSnapshot } | null = null;

  return {
    id: "pihole",
    label: "Pi-hole",
    description: "Live DNS queries, blocks and upstream health",
    mode: "live",
    async getSnapshot(): Promise<Snapshot<PiholeSnapshot>> {
      const started = performance.now();

      if (!cache || Date.now() - cache.at >= CACHE_TTL_MS) {
        cache = { at: Date.now(), data: await fetchPiholeSnapshot(client) };
      }

      return {
        source: "pihole",
        data: cache.data,
        fetchedAt: new Date(cache.at).toISOString(),
        status: "ok",
        mode: "live",
        latencyMs: Math.round(performance.now() - started),
      };
    },
  };
}
