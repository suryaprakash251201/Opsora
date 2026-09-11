"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AdapterSourceId,
  Snapshot,
  SnapshotBundle,
  SnapshotMap,
} from "@/lib/adapters/types";
import type { ActivityEvent } from "@/lib/activity";
import { useRealtimeStore } from "@/stores/realtime-store";

export interface DashboardSnapshot {
  sources: SnapshotBundle;
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
  // The SSE stream pushes updates every 5s; polling is only the fallback
  // for when the stream is disconnected or unsupported.
  const connected = useRealtimeStore((state) => state.connected);

  return useQuery<DashboardSnapshot>({
    queryKey: ["snapshot"],
    queryFn: () => fetchJson<DashboardSnapshot>("/api/snapshot"),
    refetchInterval: connected ? false : refetchInterval,
  });
}

export function useSourceSnapshot<K extends AdapterSourceId>(
  source: K,
  refetchInterval: number,
) {
  const connected = useRealtimeStore((state) => state.connected);

  return useQuery<Snapshot<SnapshotMap[K]>>({
    queryKey: ["source", source],
    queryFn: () => fetchJson<Snapshot<SnapshotMap[K]>>(`/api/sources/${source}`),
    refetchInterval: connected ? false : refetchInterval,
  });
}

export interface SourceStatusEntry {
  id: AdapterSourceId;
  label: string;
  description: string;
  mode: "live" | "empty";
  status: "ok" | "stale" | "error";
  error: string | null;
  latencyMs: number;
  fetchedAt: string;
}

export interface AgentStatusEntry {
  hostname: string;
  role: string;
  os: string;
  online: boolean;
  receivedAt: string;
}

export interface StatusResponse {
  sources: SourceStatusEntry[];
  agents: AgentStatusEntry[];
  serverTime: string;
  uptimeSeconds: number;
  version: string;
  desktop: {
    active: boolean;
    dataDir: string | null;
    configFile: string | null;
  };
  channels: {
    id: "telegram" | "discord";
    label: string;
    configured: boolean;
    hint: string;
  }[];
}

export function useSourceStatus(refetchInterval = 15_000) {
  return useQuery<StatusResponse>({
    queryKey: ["status"],
    queryFn: () => fetchJson<StatusResponse>("/api/status"),
    refetchInterval,
  });
}
