import type { AdapterSourceId, SnapshotMap } from "@/lib/adapters/types";
import type { ServersSnapshot } from "@/lib/types/servers";

/**
 * Per-source metadata and empty payloads. Unconfigured sources resolve to
 * these honest empty states — the app contains no mock data generators.
 */
export const SOURCE_META: {
  [K in AdapterSourceId]: {
    label: string;
    description: string;
    empty: SnapshotMap[K];
  };
} = {
  servers: {
    label: "Linux agent",
    description: "CPU, memory, disks, processes and services",
    empty: {
      servers: [],
      summary: {
        online: 0,
        total: 0,
        cpuAvg: 0,
        memoryUsedBytes: 0,
        memoryTotalBytes: 0,
        diskAvg: 0,
      },
      updatedAt: "",
    } satisfies ServersSnapshot,
  },
  github: {
    label: "GitHub",
    description: "Repositories, pull requests, issues, Actions and releases",
    empty: {
      user: { login: "", name: "", avatarUrl: "" },
      stats: {
        repos: 0,
        openPulls: 0,
        openIssues: 0,
        commitsToday: 0,
        stars: 0,
        failingWorkflows: 0,
        runningWorkflows: 0,
        releases: 0,
      },
      repos: [],
      pulls: [],
      issues: [],
      runs: [],
      releases: [],
      languages: [],
      activity: [],
      updatedAt: "",
    },
  },
  pihole: {
    label: "Pi-hole",
    description: "DNS queries, blocks, clients and upstream health",
    empty: {
      summary: {
        queries: 0,
        blocked: 0,
        blockRate: 0,
        clients: 0,
        domains: 0,
        upstreamStatus: "healthy",
        latencyMs: 0,
        gravityUpdatedAt: "",
      },
      history: [],
      topClients: [],
      topBlocked: [],
      topPermitted: [],
      updatedAt: "",
    },
  },
  docker: {
    label: "Docker",
    description: "Containers, health, resource usage and restarts",
    empty: {
      summary: {
        running: 0,
        stopped: 0,
        unhealthy: 0,
        images: 0,
        restarts24h: 0,
        memoryUsedMb: 0,
      },
      containers: [],
      updatedAt: "",
    },
  },
  calendar: {
    label: "Calendar",
    description: "Today and the next seven days",
    empty: { events: [], updatedAt: "" },
  },
};

export type ServerId = keyof typeof SOURCE_META;
