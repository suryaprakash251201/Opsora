import { getAllSnapshots, getSourceStatuses } from "@/lib/adapters";
import {
  getAgentMetrics,
  isAgentOnline,
} from "@/lib/adapters/live/agent-store";
import { getChannelStatuses } from "@/lib/server/alert-channels";
import { readPackageVersion } from "@/lib/server/package-meta";
import { noStoreJson, apiError } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [statuses, snapshots, agents] = await Promise.all([
      getSourceStatuses(),
      getAllSnapshots(),
      getAgentMetrics(),
    ]);

    return noStoreJson({
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
      version: readPackageVersion(),
      channels: getChannelStatuses(),
      desktop: {
        active: process.env.OPSORA_DESKTOP === "1",
        dataDir: process.env.OPSORA_DATA_DIR?.trim() || null,
        configFile: process.env.OPSORA_CONFIG_FILE?.trim() || null,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
