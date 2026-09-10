import type {
  AdapterSourceId,
  Snapshot,
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

export function createMockAdapter<K extends AdapterSourceId>(
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
    mode: "mock",
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
        mode: "mock",
        latencyMs: Math.round(performance.now() - started),
      } satisfies Snapshot<SnapshotMap[K]>;
    },
  };
}

export const mockAdapters: {
  [K in AdapterSourceId]: SourceAdapter<SnapshotMap[K]>;
} = {
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
};
