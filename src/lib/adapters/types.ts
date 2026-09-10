import type { CalendarSnapshot } from "@/lib/mock/calendar";
import type { DockerSnapshot } from "@/lib/mock/docker";
import type { GithubSnapshot } from "@/lib/mock/github";
import type { PiholeSnapshot } from "@/lib/mock/pihole";
import type { ServersSnapshot } from "@/lib/mock/servers";
import type { SourceId } from "@/lib/attention/types";

export type AdapterSourceId = Exclude<SourceId, "todos">;

export interface SnapshotMap {
  servers: ServersSnapshot;
  github: GithubSnapshot;
  pihole: PiholeSnapshot;
  docker: DockerSnapshot;
  calendar: CalendarSnapshot;
}

export interface Snapshot<T> {
  source: AdapterSourceId;
  data: T;
  fetchedAt: string;
  status: "ok" | "stale" | "error";
  /** Whether the data came from a real integration or a mock adapter. */
  mode: "live" | "mock";
  /** Present when a live source failed and the mock fallback was used. */
  error?: string;
  latencyMs: number;
}

export interface SourceAdapter<T> {
  id: AdapterSourceId;
  label: string;
  description: string;
  mode: "live" | "mock";
  getSnapshot(): Promise<Snapshot<T>>;
}

export type SnapshotBundle = {
  [K in AdapterSourceId]: Snapshot<SnapshotMap[K]>;
};
