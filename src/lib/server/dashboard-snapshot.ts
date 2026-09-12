import { getAllSnapshots } from "@/lib/adapters";
import type { SnapshotBundle } from "@/lib/adapters/types";
import { getActivityFeed, type ActivityEvent } from "@/lib/activity";

export interface DashboardPayload {
  sources: SnapshotBundle;
  activity: ActivityEvent[];
  fetchedAt: string;
}

/**
 * Single builder for the dashboard payload served by both GET /api/snapshot
 * and the /api/stream SSE ticks. Keeps the two shapes identical by
 * construction — previously each route assembled the envelope inline.
 */
export async function buildDashboardSnapshot(): Promise<DashboardPayload> {
  const sources = await getAllSnapshots();
  return {
    sources,
    activity: getActivityFeed(sources),
    fetchedAt: new Date().toISOString(),
  };
}
