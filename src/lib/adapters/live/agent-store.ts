import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface AgentMetrics {
  hostname: string;
  os: string;
  role: string;
  uptimeSeconds: number;
  cpu: {
    usage: number;
    load1: number;
    load5: number;
    load15: number;
    temperatureC: number;
    cores: number;
  };
  memory: {
    usedBytes: number;
    totalBytes: number;
  };
  disks: { mount: string; usedBytes: number; totalBytes: number }[];
  network: {
    rxMbps: number;
    txMbps: number;
    latencyMs: number;
    packets: number;
  };
  services: { name: string; label: string; status: "running" | "stopped" | "degraded" }[];
  processes: { name: string; cpu: number; memoryMb: number }[];
  receivedAt: string;
}

export interface AgentHistory {
  cpu: number[];
  memory: number[];
  network: number[];
}

const HISTORY_LIMIT = 48;

const store = new Map<string, AgentMetrics>();
const historyStore = new Map<string, AgentHistory>();

const dataDir = process.env.OPSORA_DATA_DIR ?? path.join(process.cwd(), ".data");
const metricsFile = path.join(dataDir, "agent-metrics.json");

let loadPromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await readFile(metricsFile, "utf8");
        const parsed = JSON.parse(raw) as AgentMetrics[];
        for (const metrics of parsed) {
          store.set(metrics.hostname, metrics);
        }
      } catch {
        // No persisted metrics yet — first run.
      }
    })();
  }
  return loadPromise;
}

async function persist(): Promise<void> {
  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      metricsFile,
      JSON.stringify([...store.values()], null, 2),
      "utf8",
    );
  } catch {
    // Best effort; in-memory metrics still work.
  }
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeAgentPayload(payload: unknown): AgentMetrics {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Payload must be a JSON object");
  }

  const raw = payload as Record<string, unknown>;
  const hostname = asString(raw.hostname).trim();
  if (!hostname) throw new Error("hostname is required");

  const cpu = (raw.cpu ?? {}) as Record<string, unknown>;
  const memory = (raw.memory ?? {}) as Record<string, unknown>;
  const network = (raw.network ?? {}) as Record<string, unknown>;

  return {
    hostname,
    os: asString(raw.os, "Linux"),
    role: asString(raw.role, "Monitored host"),
    uptimeSeconds: asNumber(raw.uptimeSeconds),
    cpu: {
      usage: asNumber(cpu.usage),
      load1: asNumber(cpu.load1),
      load5: asNumber(cpu.load5),
      load15: asNumber(cpu.load15),
      temperatureC: asNumber(cpu.temperatureC),
      cores: Math.max(1, asNumber(cpu.cores, 1)),
    },
    memory: {
      usedBytes: asNumber(memory.usedBytes),
      totalBytes: Math.max(1, asNumber(memory.totalBytes, 1)),
    },
    disks: asArray<Record<string, unknown>>(raw.disks)
      .slice(0, 12)
      .map((disk) => ({
        mount: asString(disk.mount, "/"),
        usedBytes: asNumber(disk.usedBytes),
        totalBytes: Math.max(1, asNumber(disk.totalBytes, 1)),
      })),
    network: {
      rxMbps: asNumber(network.rxMbps),
      txMbps: asNumber(network.txMbps),
      latencyMs: asNumber(network.latencyMs),
      packets: asNumber(network.packets),
    },
    services: asArray<Record<string, unknown>>(raw.services)
      .slice(0, 20)
      .map((service) => ({
        name: asString(service.name, "service"),
        label: asString(service.label, asString(service.name, "Service")),
        status:
          service.status === "running" ||
          service.status === "stopped" ||
          service.status === "degraded"
            ? service.status
            : "running",
      })),
    processes: asArray<Record<string, unknown>>(raw.processes)
      .slice(0, 10)
      .map((process) => ({
        name: asString(process.name, "process"),
        cpu: asNumber(process.cpu),
        memoryMb: asNumber(process.memoryMb),
      })),
    receivedAt: new Date().toISOString(),
  };
}

export async function ingestAgentMetrics(
  payload: unknown,
): Promise<AgentMetrics> {
  await ensureLoaded();

  const metrics = normalizeAgentPayload(payload);
  store.set(metrics.hostname, metrics);

  const memoryPercent =
    (metrics.memory.usedBytes / metrics.memory.totalBytes) * 100;
  const previous = historyStore.get(metrics.hostname) ?? {
    cpu: [],
    memory: [],
    network: [],
  };

  historyStore.set(metrics.hostname, {
    cpu: [...previous.cpu, metrics.cpu.usage].slice(-HISTORY_LIMIT),
    memory: [...previous.memory, memoryPercent].slice(-HISTORY_LIMIT),
    network: [...previous.network, metrics.network.rxMbps].slice(-HISTORY_LIMIT),
  });

  await persist();
  return metrics;
}

export async function getAgentMetrics(): Promise<AgentMetrics[]> {
  await ensureLoaded();
  return [...store.values()];
}

export async function hasAgentMetrics(): Promise<boolean> {
  await ensureLoaded();
  return store.size > 0;
}

export function getAgentHistory(hostname: string): AgentHistory {
  return (
    historyStore.get(hostname) ?? { cpu: [], memory: [], network: [] }
  );
}

export function isAgentOnline(metrics: AgentMetrics, now = Date.now()): boolean {
  if (metrics.cpu.usage === 0 && metrics.memory.usedBytes === 0) return false;
  const age = now - new Date(metrics.receivedAt).getTime();
  return age < 5 * 60_000;
}
