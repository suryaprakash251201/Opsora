import type {
  Snapshot,
  SourceAdapter,
} from "@/lib/adapters/types";
import type { Server, ServersSnapshot } from "@/lib/mock/servers";
import {
  getAgentHistory,
  getAgentMetrics,
  isAgentOnline,
  type AgentMetrics,
} from "./agent-store";

function toServer(metrics: AgentMetrics): Server {
  return {
    id: metrics.hostname.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    name: metrics.hostname,
    host: metrics.hostname,
    role: metrics.role,
    os: metrics.os,
    online: isAgentOnline(metrics),
    uptimeSeconds: metrics.uptimeSeconds,
    updatedAt: metrics.receivedAt,
    cpu: metrics.cpu,
    memory: metrics.memory,
    disks: metrics.disks,
    network: metrics.network,
    processes: metrics.processes,
    services: metrics.services,
    history: getAgentHistory(metrics.hostname),
  };
}

export function createAgentAdapter(): SourceAdapter<ServersSnapshot> {
  return {
    id: "servers",
    label: "Linux agent",
    description: "Live metrics reported by the Opsora agent",
    mode: "live",
    async getSnapshot(): Promise<Snapshot<ServersSnapshot>> {
      const started = performance.now();
      const metrics = await getAgentMetrics();
      const servers = metrics.map(toServer);
      const online = servers.filter((server) => server.online);

      const diskPercents = servers.flatMap((server) =>
        server.disks.map((disk) => (disk.usedBytes / disk.totalBytes) * 100),
      );

      const data: ServersSnapshot = {
        servers,
        summary: {
          online: online.length,
          total: servers.length,
          cpuAvg: online.length
            ? Number(
                (
                  online.reduce((total, server) => total + server.cpu.usage, 0) /
                  online.length
                ).toFixed(1),
              )
            : 0,
          memoryUsedBytes: online.reduce(
            (total, server) => total + server.memory.usedBytes,
            0,
          ),
          memoryTotalBytes: online.reduce(
            (total, server) => total + server.memory.totalBytes,
            0,
          ),
          diskAvg: diskPercents.length
            ? Number(
                (
                  diskPercents.reduce((a, b) => a + b, 0) / diskPercents.length
                ).toFixed(1),
              )
            : 0,
        },
        updatedAt: new Date().toISOString(),
      };

      return {
        source: "servers",
        data,
        fetchedAt: new Date().toISOString(),
        status: "ok",
        mode: "live",
        latencyMs: Math.round(performance.now() - started),
      };
    },
  };
}
