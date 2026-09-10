import { getAllSnapshots, getSourceStatuses } from "@/lib/adapters";
import {
  getAgentMetrics,
  isAgentOnline,
} from "@/lib/adapters/live/agent-store";
import { getChannelStatuses } from "@/lib/server/alert-channels";

export async function GET() {
  const [statuses, snapshots, agents] = await Promise.all([
    getSourceStatuses(),
    getAllSnapshots(),
    getAgentMetrics(),
  ]);

  return Response.json({
    sources: statuses.map((status) => {
      const snapshot = snapshots[status.id];
      return {
        id: status.id,
        label: status.label,
        description: status.description,
        mode: snapshot.mode,
        status: snapshot.status,
        error: snapshot.error ?? null,
        latencyMs: snapshot.latencyMs,
        fetchedAt: snapshot.fetchedAt,
      };
    }),
    agents: agents.map((metrics) => ({
      hostname: metrics.hostname,
      role: metrics.role,
      os: metrics.os,
      online: isAgentOnline(metrics),
      receivedAt: metrics.receivedAt,
    })),
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    channels: getChannelStatuses(),
  });
}
