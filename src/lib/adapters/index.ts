import { existsSync } from "node:fs";
import type {
  AdapterSourceId,
  Snapshot,
  SnapshotBundle,
  SnapshotMap,
  SourceAdapter,
} from "@/lib/adapters/types";
import { createAgentAdapter } from "@/lib/adapters/live/agent";
import { hasAgentMetrics } from "@/lib/adapters/live/agent-store";
import { createGoogleCalendarAdapter } from "@/lib/adapters/live/calendar";
import { createDockerAdapter } from "@/lib/adapters/live/docker";
import { createGithubAdapter } from "@/lib/adapters/live/github";
import { createPiholeAdapter } from "@/lib/adapters/live/pihole";
import { SOURCE_META, type ServerId } from "@/lib/adapters/sources";

const dockerSocket = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock";
const DEGRADE_WINDOW_MS = 60_000;

type Resolver<K extends AdapterSourceId> = () => Promise<
  SourceAdapter<SnapshotMap[K]> | null
>;

/** Live adapters are singletons so their internal caches survive requests. */
const liveAdapters = new Map<AdapterSourceId, SourceAdapter<never>>();

function memo<K extends AdapterSourceId>(
  source: K,
  factory: () => SourceAdapter<SnapshotMap[K]>,
): SourceAdapter<SnapshotMap[K]> {
  const cached = liveAdapters.get(source) as
    | SourceAdapter<SnapshotMap[K]>
    | undefined;
  if (cached) return cached;

  const adapter = factory();
  liveAdapters.set(source, adapter as unknown as SourceAdapter<never>);
  return adapter;
}

/**
 * Each resolver returns its live adapter, or null when the source has no
 * credentials/data yet. Null means the dashboard simply shows an empty state
 * for that source — there is no mock fallback anywhere in the app.
 */
const resolvers: { [K in AdapterSourceId]: Resolver<K> } = {
  /** Live once the agent has reported metrics (see /api/agent). */
  servers: async () =>
    (await hasAgentMetrics()) ? memo("servers", createAgentAdapter) : null,

  /** Live when GITHUB_TOKEN is configured. */
  github: async () => {
    const token = process.env.GITHUB_TOKEN?.trim();
    return token ? memo("github", () => createGithubAdapter(token)) : null;
  },

  /** Live when PIHOLE_URL is configured. */
  pihole: async () => {
    const url = process.env.PIHOLE_URL?.trim();
    return url
      ? memo("pihole", () =>
          createPiholeAdapter(url, process.env.PIHOLE_PASSWORD ?? ""),
        )
      : null;
  },

  /** Live when the Docker socket exists; set OPSORA_DOCKER=0 to opt out. */
  docker: async () => {
    const enabled =
      !["0", "false"].includes(
        process.env.OPSORA_DOCKER?.trim().toLowerCase() ?? "",
      );
    return enabled && existsSync(dockerSocket)
      ? memo("docker", () => createDockerAdapter(dockerSocket))
      : null;
  },

  /** Google Calendar is live when its OAuth credentials are configured. */
  calendar: async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

    if (!clientId || !clientSecret || !refreshToken) return null;

    return memo("calendar", () =>
      createGoogleCalendarAdapter({
        clientId,
        clientSecret,
        refreshToken,
        calendarId: process.env.GOOGLE_CALENDAR_ID?.trim(),
      }),
    );
  },
};

/** When a live source fails, remember for a while to avoid hammering it. */
const degradedUntil = new Map<AdapterSourceId, number>();

function adapterFor<K extends AdapterSourceId>(
  source: K,
): SourceAdapter<SnapshotMap[K]> {
  const meta = SOURCE_META[source];
  const emptySnapshot = (): Snapshot<SnapshotMap[K]> => {
    const now = new Date().toISOString();
    return {
      source,
      data: meta.empty,
      fetchedAt: now,
      status: "stale",
      mode: "live",
      latencyMs: 0,
    };
  };

  return {
    id: source,
    label: meta.label,
    description: meta.description,
    mode: "live",
    getSnapshot: async () => emptySnapshot(),
  };
}

function degradedSnapshot<K extends AdapterSourceId>(
  source: K,
  error?: unknown,
): Snapshot<SnapshotMap[K]> {
  return {
    source,
    data: SOURCE_META[source].empty,
    fetchedAt: new Date().toISOString(),
    status: "error",
    mode: "live",
    error:
      error instanceof Error
        ? error.message
        : "Live source unavailable — showing an empty state",
    latencyMs: 0,
  };
}

export const adapterSources = Object.keys(
  SOURCE_META,
) as unknown as AdapterSourceId[];

export function isAdapterSource(value: string): value is AdapterSourceId {
  return (adapterSources as string[]).includes(value);
}

export async function getSnapshot<K extends AdapterSourceId>(
  source: K,
): Promise<Snapshot<SnapshotMap[K]>> {
  const adapter = await resolvers[source]();

  if (!adapter) {
    // Not configured: an honest empty state instead of fake data.
    return adapterFor(source).getSnapshot();
  }

  if (Date.now() < (degradedUntil.get(source) ?? 0)) {
    return degradedSnapshot(source);
  }

  try {
    const snapshot = await adapter.getSnapshot();
    degradedUntil.delete(source);
    return snapshot;
  } catch (error) {
    degradedUntil.set(source, Date.now() + DEGRADE_WINDOW_MS);
    console.error(`[opsora:${source}] live source failed:`, error);
    return degradedSnapshot(source, error);
  }
}

export async function getAllSnapshots(): Promise<SnapshotBundle> {
  const [servers, github, pihole, docker, calendar] = await Promise.all([
    getSnapshot("servers"),
    getSnapshot("github"),
    getSnapshot("pihole"),
    getSnapshot("docker"),
    getSnapshot("calendar"),
  ]);

  return { servers, github, pihole, docker, calendar };
}

export interface SourceStatus {
  id: AdapterSourceId;
  label: string;
  description: string;
  mode: "live" | "mock";
}

export async function getSourceStatuses(): Promise<SourceStatus[]> {
  return Promise.all(
    adapterSources.map(async (source) => {
      const adapter = (await resolvers[source]()) ?? adapterFor(source);
      return {
        id: source,
        label: adapter.label,
        description: adapter.description,
        mode: adapter.mode,
      };
    }),
  );
}

export type { ServerId };
