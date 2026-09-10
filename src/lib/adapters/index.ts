import type {
  AdapterSourceId,
  Snapshot,
  SnapshotBundle,
  SnapshotMap,
  SourceAdapter,
} from "@/lib/adapters/types";
import { getCalendarSnapshot } from "@/lib/mock/calendar";
import { getDockerSnapshot } from "@/lib/mock/docker";
import { getGithubSnapshot } from "@/lib/mock/github";
import { getPiholeSnapshot } from "@/lib/mock/pihole";
import { getServersSnapshot } from "@/lib/mock/servers";

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function createMockAdapter<K extends AdapterSourceId>(
  id: K,
  label: string,
  description: string,
  load: () => SnapshotMap[K],
  latency: [number, number],
): SourceAdapter<SnapshotMap[K]> {
  return {
    id,
    label,
    description,
    async getSnapshot() {
      const started = performance.now();
      await delay(
        Math.round(latency[0] + Math.random() * (latency[1] - latency[0])),
      );

      return {
        source: id,
        data: load(),
        fetchedAt: new Date().toISOString(),
        status: "ok",
        latencyMs: Math.round(performance.now() - started),
      };
    },
  };
}

export const adapters = {
  servers: createMockAdapter(
    "servers",
    "Linux agent",
    "CPU, memory, disks, processes and services",
    getServersSnapshot,
    [70, 190],
  ),
  github: createMockAdapter(
    "github",
    "GitHub",
    "Repositories, pull requests, issues and Actions",
    getGithubSnapshot,
    [90, 260],
  ),
  pihole: createMockAdapter(
    "pihole",
    "Pi-hole",
    "DNS queries, blocks, clients and upstream health",
    getPiholeSnapshot,
    [60, 170],
  ),
  docker: createMockAdapter(
    "docker",
    "Docker",
    "Containers, health, resource usage and restarts",
    getDockerSnapshot,
    [50, 140],
  ),
  calendar: createMockAdapter(
    "calendar",
    "Calendar",
    "Today and the next seven days",
    getCalendarSnapshot,
    [40, 110],
  ),
} satisfies { [K in AdapterSourceId]: SourceAdapter<SnapshotMap[K]> };

export const adapterSources = Object.keys(adapters) as AdapterSourceId[];

export function isAdapterSource(value: string): value is AdapterSourceId {
  return value in adapters;
}

export function getSnapshot<K extends AdapterSourceId>(
  source: K,
): Promise<Snapshot<SnapshotMap[K]>> {
  return adapters[source].getSnapshot() as Promise<Snapshot<SnapshotMap[K]>>;
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
