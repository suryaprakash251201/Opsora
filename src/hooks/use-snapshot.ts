"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AdapterSourceId,
  Snapshot,
  SnapshotMap,
} from "@/lib/adapters/types";
import type { ActivityEvent } from "@/lib/mock/activity";

export interface DashboardSnapshot {
  sources: { [K in AdapterSourceId]: Snapshot<SnapshotMap[K]> };
  activity: ActivityEvent[];
  fetchedAt: string;
}

export const REFETCH_INTERVALS = {
  servers: 30_000,
  docker: 45_000,
  github: 60_000,
  pihole: 60_000,
  calendar: 300_000,
} as const;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function useDashboardSnapshot(refetchInterval = 30_000) {
  return useQuery<DashboardSnapshot>({
    queryKey: ["snapshot"],
    queryFn: () => fetchJson<DashboardSnapshot>("/api/snapshot"),
    refetchInterval,
  });
}

export function useSourceSnapshot<K extends AdapterSourceId>(
  source: K,
  refetchInterval: number,
) {
  return useQuery<Snapshot<SnapshotMap[K]>>({
    queryKey: ["source", source],
    queryFn: () => fetchJson<Snapshot<SnapshotMap[K]>>(`/api/sources/${source}`),
    refetchInterval,
  });
}
