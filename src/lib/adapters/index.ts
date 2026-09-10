import { existsSync } from "node:fs";
import type {
  AdapterSourceId,
  Snapshot,
  SnapshotBundle,
  SnapshotMap,
  SourceAdapter,
} from "@/lib/adapters/types";
import { mockAdapters } from "@/lib/adapters/mock";
import { createAgentAdapter } from "@/lib/adapters/live/agent";
import { hasAgentMetrics } from "@/lib/adapters/live/agent-store";
import { createGoogleCalendarAdapter } from "@/lib/adapters/live/calendar";
import { createDockerAdapter } from "@/lib/adapters/live/docker";
import { createGithubAdapter } from "@/lib/adapters/live/github";
import { createPiholeAdapter } from "@/lib/adapters/live/pihole";

const dockerSocket = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock";
const DEGRADE_WINDOW_MS = 60_000;

type Resolver<K extends AdapterSourceId> = () => Promise<
  SourceAdapter<SnapshotMap[K]>
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
  liveAdapters.set(
    source,
    adapter as unknown as SourceAdapter<never>,
  );
  return adapter;
}

const resolvers: { [K in AdapterSourceId]: Resolver<K> } = {
  /**
   * Live when the agent has reported metrics (see /api/agent), otherwise the
   * built-in mock so the dashboard is never empty.
   */
  servers: async () =>
    (await hasAgentMetrics())
      ? memo("servers", createAgentAdapter)
      : mockAdapters.servers,

  /** Live when GITHUB_TOKEN is configured. */
  github: async () => {
    const token = process.env.GITHUB_TOKEN?.trim();
    return token
      ? memo("github", () => createGithubAdapter(token))
      : mockAdapters.github;
  },

  /** Live when PIHOLE_URL is configured. */
  pihole: async () => {
    const url = process.env.PIHOLE_URL?.trim();
    return url
      ? memo("pihole", () =>
          createPiholeAdapter(url, process.env.PIHOLE_PASSWORD ?? ""),
        )
      : mockAdapters.pihole;
  },

  /** Live when the Docker socket exists; set OPSORA_DOCKER=mock to opt out. */
  docker: async () => {
    const enabled =
      process.env.OPSORA_DOCKER?.trim().toLowerCase() !== "mock";
    return enabled && existsSync(dockerSocket)
      ? memo("docker", () => createDockerAdapter(dockerSocket))
      : mockAdapters.docker;
  },

  /** Google Calendar is live when its OAuth credentials are configured. */
  calendar: async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

    if (!clientId || !clientSecret || !refreshToken) {
      return mockAdapters.calendar;
    }

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

async function fallbackSnapshot<K extends AdapterSourceId>(
  source: K,
  error?: unknown,
): Promise<Snapshot<SnapshotMap[K]>> {
  const snapshot = await mockAdapters[source].getSnapshot();
  return {
    ...snapshot,
    status: "error",
    error:
      error instanceof Error
        ? error.message
        : "Live source unavailable — showing demo data",
  };
}

export const adapterSources = Object.keys(mockAdapters) as AdapterSourceId[];

export function isAdapterSource(value: string): value is AdapterSourceId {
  return (adapterSources as string[]).includes(value);
}

export async function getSnapshot<K extends AdapterSourceId>(
  source: K,
): Promise<Snapshot<SnapshotMap[K]>> {
  const adapter = await resolvers[source]();
  if (adapter.mode === "mock") return adapter.getSnapshot();

  if (Date.now() < (degradedUntil.get(source) ?? 0)) {
    return fallbackSnapshot(source);
  }

  try {
    const snapshot = await adapter.getSnapshot();
    degradedUntil.delete(source);
    return snapshot;
  } catch (error) {
    degradedUntil.set(source, Date.now() + DEGRADE_WINDOW_MS);
    console.error(`[opsora:${source}] live source failed:`, error);
    return fallbackSnapshot(source, error);
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
      const adapter = await resolvers[source]();
      return {
        id: source,
        label: adapter.label,
        description: adapter.description,
        mode: adapter.mode,
      };
    }),
  );
}
