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
import { createDockerAdapter } from "@/lib/adapters/live/docker";
import { createGithubAdapter } from "@/lib/adapters/live/github";
import { createPiholeAdapter } from "@/lib/adapters/live/pihole";

const dockerSocket = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock";

type Resolver<K extends AdapterSourceId> = () => Promise<
  SourceAdapter<SnapshotMap[K]>
>;

const resolvers: { [K in AdapterSourceId]: Resolver<K> } = {
  /**
   * Live when the agent has reported metrics (see /api/agent), otherwise the
   * built-in mock so the dashboard is never empty.
   */
  servers: async () =>
    (await hasAgentMetrics()) ? createAgentAdapter() : mockAdapters.servers,

  /** Live when GITHUB_TOKEN is configured. */
  github: async () => {
    const token = process.env.GITHUB_TOKEN?.trim();
    return token ? createGithubAdapter(token) : mockAdapters.github;
  },

  /** Live when PIHOLE_URL is configured. */
  pihole: async () => {
    const url = process.env.PIHOLE_URL?.trim();
    if (!url) return mockAdapters.pihole;
    return createPiholeAdapter(url, process.env.PIHOLE_PASSWORD ?? "");
  },

  /** Live when the Docker socket exists; set OPSORA_DOCKER=mock to opt out. */
  docker: async () => {
    const enabled = process.env.OPSORA_DOCKER?.trim().toLowerCase() !== "mock";
    if (enabled && existsSync(dockerSocket)) {
      return createDockerAdapter(dockerSocket);
    }
    return mockAdapters.docker;
  },

  /** Google Calendar OAuth is still on the roadmap. */
  calendar: async () => mockAdapters.calendar,
};

export const adapterSources = Object.keys(mockAdapters) as AdapterSourceId[];

export function isAdapterSource(value: string): value is AdapterSourceId {
  return (adapterSources as string[]).includes(value);
}

export async function getSnapshot<K extends AdapterSourceId>(
  source: K,
): Promise<Snapshot<SnapshotMap[K]>> {
  const adapter = await resolvers[source]();
  return adapter.getSnapshot();
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
