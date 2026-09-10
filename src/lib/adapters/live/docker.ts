import http from "node:http";
import type { Snapshot, SourceAdapter } from "@/lib/adapters/types";
import type { DockerContainer, DockerSnapshot } from "@/lib/mock/docker";

const DEFAULT_SOCKET =
  process.env.DOCKER_SOCKET ?? "/var/run/docker.sock";

const CACHE_TTL_MS = 15_000;
const STATS_LIMIT = 14;

interface DockerListContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
  Ports?: { PrivatePort: number; PublicPort?: number; Type: string }[];
}

interface DockerStats {
  cpu_stats: {
    cpu_usage: { total_usage: number; percpu_usage?: number[] };
    system_cpu_usage: number;
    online_cpus?: number;
  };
  precpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage?: number;
    limit?: number;
    stats?: { inactive_file?: number };
  };
}

function dockerGet<T>(socketPath: string, path: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const request = http.request(
      {
        socketPath,
        path,
        method: "GET",
        headers: { Host: "docker" },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          body += chunk;
        });
        response.on("end", () => {
          if (!response.statusCode || response.statusCode >= 400) {
            reject(
              new Error(`Docker ${path} responded with ${response.statusCode}`),
            );
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.setTimeout(6_000, () => {
      request.destroy(new Error(`Docker ${path} timed out`));
    });
    request.on("error", reject);
    request.end();
  });
}

const UNIT_SECONDS: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: 3_600,
  day: 86_400,
  week: 604_800,
  month: 2_592_000,
};

export function parseUptimeSeconds(status: string): number {
  if (!status.startsWith("Up ")) return 0;

  const about = status.match(
    /^Up About an? (second|minute|hour|day|week|month)/i,
  );
  if (about) return UNIT_SECONDS[about[1].toLowerCase()] ?? 0;

  const match = status.match(
    /^Up (\d+) (second|minute|hour|day|week|month)/i,
  );
  if (!match) return 0;

  return Number(match[1]) * (UNIT_SECONDS[match[2].toLowerCase()] ?? 0);
}

export function parseHealth(
  status: string,
): DockerContainer["health"] {
  if (status.includes("(unhealthy)")) return "unhealthy";
  if (status.includes("(healthy)")) return "healthy";
  if (status.includes("(health: starting)")) return "starting";
  return "none";
}

export function computeCpuPercent(stats: DockerStats): number {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cores =
    stats.cpu_stats.online_cpus ??
    stats.cpu_stats.cpu_usage.percpu_usage?.length ??
    1;

  if (cpuDelta <= 0 || systemDelta <= 0) return 0;
  return Number(((cpuDelta / systemDelta) * cores * 100).toFixed(2));
}

function parsePorts(container: DockerListContainer): string {
  const ports = (container.Ports ?? [])
    .map((port) => port.PublicPort)
    .filter((port): port is number => typeof port === "number");

  return ports.length > 0 ? [...new Set(ports)].join(", ") : "-";
}

async function fetchDockerSnapshot(socketPath: string): Promise<DockerSnapshot> {
  const list = await dockerGet<DockerListContainer[]>(
    socketPath,
    "/containers/json?all=true",
  );

  const running = list.filter((container) => container.State === "running");
  const statsResults = await Promise.allSettled(
    running
      .slice(0, STATS_LIMIT)
      .map((container) =>
        dockerGet<DockerStats>(
          socketPath,
          `/containers/${container.Id}/stats?stream=false`,
        ),
      ),
  );

  const statsById = new Map<string, DockerStats>();
  running.slice(0, STATS_LIMIT).forEach((container, index) => {
    const result = statsResults[index];
    if (result.status === "fulfilled") {
      statsById.set(container.Id, result.value);
    }
  });

  const containers: DockerContainer[] = list.map((container) => {
    const stats = statsById.get(container.Id);
    const bytes = stats
      ? Math.max(
          0,
          (stats.memory_stats.usage ?? 0) -
            (stats.memory_stats.stats?.inactive_file ?? 0),
        )
      : 0;
    const limit = stats?.memory_stats.limit ?? 0;

    return {
      id: container.Id.slice(0, 12),
      name: (container.Names[0] ?? container.Id).replace(/^\//, ""),
      image: container.Image,
      state:
        container.State === "running"
          ? "running"
          : container.State === "restarting"
            ? "restarting"
            : "exited",
      health: parseHealth(container.Status),
      cpu: stats ? computeCpuPercent(stats) : 0,
      memoryMb: Math.round(bytes / (1024 * 1024)),
      memoryLimitMb: Math.round(limit / (1024 * 1024)),
      ports: parsePorts(container),
      uptimeSeconds: parseUptimeSeconds(container.Status),
      restarts24h: 0,
    };
  });

  const runningContainers = containers.filter(
    (container) => container.state === "running",
  );

  return {
    summary: {
      running: runningContainers.length,
      stopped: containers.length - runningContainers.length,
      unhealthy: runningContainers.filter(
        (container) => container.health === "unhealthy",
      ).length,
      images: new Set(containers.map((container) => container.image)).size,
      restarts24h: 0,
      memoryUsedMb: runningContainers.reduce(
        (total, container) => total + container.memoryMb,
        0,
      ),
    },
    containers,
    updatedAt: new Date().toISOString(),
  };
}

export function createDockerAdapter(
  socketPath: string = DEFAULT_SOCKET,
): SourceAdapter<DockerSnapshot> {
  let cache: { at: number; data: DockerSnapshot } | null = null;

  return {
    id: "docker",
    label: "Docker",
    description: "Live containers from the Docker Engine socket",
    mode: "live",
    async getSnapshot(): Promise<Snapshot<DockerSnapshot>> {
      const started = performance.now();

      if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
        return {
          source: "docker",
          data: cache.data,
          fetchedAt: new Date(cache.at).toISOString(),
          status: "ok",
          mode: "live",
          latencyMs: Math.round(performance.now() - started),
        };
      }

      const data = await fetchDockerSnapshot(socketPath);
      cache = { at: Date.now(), data };

      return {
        source: "docker",
        data,
        fetchedAt: new Date().toISOString(),
        status: "ok",
        mode: "live",
        latencyMs: Math.round(performance.now() - started),
      };
    },
  };
}
