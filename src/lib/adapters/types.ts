import type { CalendarSnapshot } from "@/lib/types/calendar";
import type { DockerSnapshot } from "@/lib/types/docker";
import type { GithubSnapshot } from "@/lib/types/github";
import type { PiholeSnapshot } from "@/lib/types/pihole";
import type { ServersSnapshot } from "@/lib/types/servers";
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
  /** "live" = real integration; "empty" = source not configured yet. */
  mode: "live" | "empty";
  /** Present when a configured live source failed. */
  error?: string;
  latencyMs: number;
}

export interface SourceAdapter<T> {
  id: AdapterSourceId;
  label: string;
  description: string;
  mode: "live" | "empty";
  getSnapshot(): Promise<Snapshot<T>>;
}

export type SnapshotBundle = {
  [K in AdapterSourceId]: Snapshot<SnapshotMap[K]>;
};
