import { createRandom, hoursAgo, oscillate, round } from "@/lib/mock/random";

const seedRandom = createRandom(20260910);
const GB = 1024 ** 3;

export interface ServerService {
  name: string;
  label: string;
  status: "running" | "stopped" | "degraded";
}

export interface ServerDisk {
  mount: string;
  usedBytes: number;
  totalBytes: number;
}

export interface ServerProcess {
  name: string;
  cpu: number;
  memoryMb: number;
}

export interface Server {
  id: string;
  name: string;
  host: string;
  role: string;
  os: string;
  online: boolean;
  uptimeSeconds: number;
  updatedAt: string;
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
  disks: ServerDisk[];
  network: {
    rxMbps: number;
    txMbps: number;
    latencyMs: number;
    packets: number;
  };
  processes: ServerProcess[];
  services: ServerService[];
  history: {
    cpu: number[];
    memory: number[];
    network: number[];
  };
}

export interface ServersSnapshot {
  servers: Server[];
  summary: {
    online: number;
    total: number;
    cpuAvg: number;
    memoryUsedBytes: number;
    memoryTotalBytes: number;
    diskAvg: number;
  };
  updatedAt: string;
}

export function getServersSnapshot(): ServersSnapshot {
  const now = Date.now();

  const servers: Server[] = [
    {
      id: "atlas",
      name: "atlas",
      host: "atlas.lan",
      role: "Primary homelab server",
      os: "Debian 12 · x86_64",
      online: true,
      uptimeSeconds: 12 * 86_400 + 7 * 3_600 + 22 * 60,
      updatedAt: new Date(now - 8_000).toISOString(),
      cpu: {
        usage: round(oscillate(23, 9, 47_000, 0.4, now)),
        load1: round(oscillate(0.72, 0.3, 60_000, 0.4, now), 2),
        load5: 0.64,
        load15: 0.58,
        temperatureC: round(oscillate(48, 4, 90_000, 1.1, now)),
        cores: 8,
      },
      memory: {
        usedBytes: round(oscillate(7.4, 0.5, 75_000, 0.9, now), 2) * GB,
        totalBytes: 16 * GB,
      },
      disks: [
        { mount: "/", usedBytes: 97.4 * GB, totalBytes: 106.8 * GB },
        { mount: "/data", usedBytes: 1.46 * 1024 * GB, totalBytes: 2.73 * 1024 * GB },
      ],
      network: {
        rxMbps: round(oscillate(412, 180, 38_000, 0, now), 0),
        txMbps: round(oscillate(86, 40, 52_000, 1.7, now), 0),
        latencyMs: round(oscillate(0.4, 0.2, 25_000, 0.8, now), 1),
        packets: 2_214_882,
      },
      processes: [
        { name: "dockerd", cpu: 8.2, memoryMb: 412 },
        { name: "node", cpu: 4.1, memoryMb: 686 },
        { name: "postgres", cpu: 3.4, memoryMb: 918 },
        { name: "next-server", cpu: 2.8, memoryMb: 524 },
        { name: "caddy", cpu: 0.6, memoryMb: 48 },
      ],
      services: [
        { name: "docker", label: "Docker", status: "running" },
        { name: "caddy", label: "Caddy", status: "running" },
        { name: "postgresql", label: "PostgreSQL", status: "running" },
        { name: "ssh", label: "SSH", status: "running" },
        { name: "nfs", label: "NFS", status: "degraded" },
      ],
      history: {
        cpu: seedRandom.walk(48, 24, 7, 4, 86),
        memory: seedRandom.walk(48, 46, 4, 30, 80),
        network: seedRandom.walk(48, 380, 120, 40, 900),
      },
    },
    {
      id: "ceres",
      name: "ceres",
      host: "ceres.lan",
      role: "DNS · Pi-hole",
      os: "Raspberry Pi OS · aarch64",
      online: true,
      uptimeSeconds: 41 * 86_400 + 3 * 3_600,
      updatedAt: new Date(now - 21_000).toISOString(),
      cpu: {
        usage: round(oscillate(11, 6, 55_000, 2.1, now)),
        load1: round(oscillate(0.31, 0.15, 64_000, 2.1, now), 2),
        load5: 0.28,
        load15: 0.26,
        temperatureC: round(oscillate(52, 3, 120_000, 0.3, now)),
        cores: 4,
      },
      memory: {
        usedBytes: round(oscillate(1.1, 0.2, 80_000, 1.4, now), 2) * GB,
        totalBytes: 4 * GB,
      },
      disks: [
        { mount: "/", usedBytes: 23.8 * GB, totalBytes: 58.4 * GB },
      ],
      network: {
        rxMbps: round(oscillate(38, 22, 33_000, 0.6, now), 1),
        txMbps: round(oscillate(21, 12, 41_000, 2.2, now), 1),
        latencyMs: round(oscillate(1.8, 0.6, 30_000, 0.2, now), 1),
        packets: 894_120,
      },
      processes: [
        { name: "pihole-FTL", cpu: 5.6, memoryMb: 224 },
        { name: "unbound", cpu: 1.8, memoryMb: 86 },
        { name: "tailscaled", cpu: 0.7, memoryMb: 64 },
      ],
      services: [
        { name: "pihole-FTL", label: "Pi-hole FTL", status: "running" },
        { name: "unbound", label: "Unbound", status: "running" },
        { name: "tailscale", label: "Tailscale", status: "running" },
        { name: "ssh", label: "SSH", status: "running" },
      ],
      history: {
        cpu: seedRandom.walk(48, 12, 5, 2, 60),
        memory: seedRandom.walk(48, 28, 3, 15, 60),
        network: seedRandom.walk(48, 40, 24, 4, 160),
      },
    },
    {
      id: "vega",
      name: "vega",
      host: "vega.opsora.dev",
      role: "Edge VPS",
      os: "Ubuntu 24.04 · x86_64",
      online: false,
      uptimeSeconds: 0,
      updatedAt: hoursAgo(2.4, now),
      cpu: {
        usage: 0,
        load1: 0,
        load5: 0,
        load15: 0,
        temperatureC: 0,
        cores: 2,
      },
      memory: {
        usedBytes: 0,
        totalBytes: 4 * GB,
      },
      disks: [],
      network: {
        rxMbps: 0,
        txMbps: 0,
        latencyMs: 0,
        packets: 0,
      },
      processes: [],
      services: [],
      history: {
        cpu: seedRandom.walk(48, 18, 9, 4, 90),
        memory: seedRandom.walk(48, 52, 5, 30, 88),
        network: seedRandom.walk(48, 120, 70, 10, 400),
      },
    },
  ];

  const online = servers.filter((server) => server.online);
  const memoryUsedBytes = online.reduce(
    (total, server) => total + server.memory.usedBytes,
    0,
  );
  const memoryTotalBytes = online.reduce(
    (total, server) => total + server.memory.totalBytes,
    0,
  );
  const diskPercents = servers.flatMap((server) =>
    server.disks.map((disk) => (disk.usedBytes / disk.totalBytes) * 100),
  );

  return {
    servers,
    summary: {
      online: online.length,
      total: servers.length,
      cpuAvg: online.length
        ? round(
            online.reduce((total, server) => total + server.cpu.usage, 0) /
              online.length,
          )
        : 0,
      memoryUsedBytes,
      memoryTotalBytes,
      diskAvg: diskPercents.length
        ? round(
            diskPercents.reduce((total, percent) => total + percent, 0) /
              diskPercents.length,
          )
        : 0,
    },
    updatedAt: new Date(now).toISOString(),
  };
}
