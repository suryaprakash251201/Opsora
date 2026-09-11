export interface PiholeHistoryPoint {
  time: string;
  queries: number;
  blocked: number;
}

export interface PiholeSnapshot {
  summary: {
    queries: number;
    blocked: number;
    blockRate: number;
    clients: number;
    domains: number;
    upstreamStatus: "healthy" | "degraded" | "down";
    latencyMs: number;
    gravityUpdatedAt: string;
  };
  history: PiholeHistoryPoint[];
  topClients: { name: string; ip: string; queries: number }[];
  topBlocked: { domain: string; count: number }[];
  topPermitted: { domain: string; count: number }[];
  updatedAt: string;
}
