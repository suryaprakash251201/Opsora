import { oscillate, round } from "@/lib/mock/random";

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: "running" | "exited" | "restarting";
  health: "healthy" | "unhealthy" | "starting" | "none";
  cpu: number;
  memoryMb: number;
  memoryLimitMb: number;
  ports: string;
  uptimeSeconds: number;
  restarts24h: number;
}

export interface DockerSnapshot {
  summary: {
    running: number;
    stopped: number;
    unhealthy: number;
    images: number;
    restarts24h: number;
    memoryUsedMb: number;
  };
  containers: DockerContainer[];
  updatedAt: string;
}

const DAY = 86_400;

const containers: DockerContainer[] = [
  {
    id: "c1",
    name: "pihole",
    image: "pihole/pihole:2026.09",
    state: "running",
    health: "healthy",
    cpu: 1.2,
    memoryMb: 224,
    memoryLimitMb: 512,
    ports: "53, 8080",
    uptimeSeconds: 41 * DAY,
    restarts24h: 0,
  },
  {
    id: "c2",
    name: "nginx",
    image: "caddy:2.10-alpine",
    state: "running",
    health: "healthy",
    cpu: 0.8,
    memoryMb: 64,
    memoryLimitMb: 256,
    ports: "80, 443",
    uptimeSeconds: 12 * DAY + 7 * 3_600,
    restarts24h: 2,
  },
  {
    id: "c3",
    name: "postgres",
    image: "postgres:18-alpine",
    state: "running",
    health: "healthy",
    cpu: 3.1,
    memoryMb: 918,
    memoryLimitMb: 2048,
    ports: "5432",
    uptimeSeconds: 12 * DAY + 7 * 3_600,
    restarts24h: 0,
  },
  {
    id: "c4",
    name: "redis",
    image: "redis:8-alpine",
    state: "running",
    health: "healthy",
    cpu: 0.4,
    memoryMb: 48,
    memoryLimitMb: 256,
    ports: "6379",
    uptimeSeconds: 12 * DAY,
    restarts24h: 0,
  },
  {
    id: "c5",
    name: "grafana",
    image: "grafana/grafana:12.2.0",
    state: "running",
    health: "healthy",
    cpu: 0.9,
    memoryMb: 312,
    memoryLimitMb: 1024,
    ports: "3000",
    uptimeSeconds: 9 * DAY,
    restarts24h: 0,
  },
  {
    id: "c6",
    name: "prometheus",
    image: "prom/prometheus:v3.7.0",
    state: "running",
    health: "healthy",
    cpu: 1.8,
    memoryMb: 640,
    memoryLimitMb: 2048,
    ports: "9090",
    uptimeSeconds: 9 * DAY,
    restarts24h: 0,
  },
  {
    id: "c7",
    name: "portainer",
    image: "portainer/portainer-ce:2.33",
    state: "running",
    health: "healthy",
    cpu: 0.3,
    memoryMb: 96,
    memoryLimitMb: 256,
    ports: "9443",
    uptimeSeconds: 30 * DAY,
    restarts24h: 0,
  },
  {
    id: "c8",
    name: "nextcloud",
    image: "nextcloud:32-apache",
    state: "running",
    health: "healthy",
    cpu: 2.4,
    memoryMb: 1120,
    memoryLimitMb: 2048,
    ports: "8081",
    uptimeSeconds: 21 * DAY,
    restarts24h: 0,
  },
  {
    id: "c9",
    name: "gitea",
    image: "gitea/gitea:1.25",
    state: "running",
    health: "healthy",
    cpu: 0.5,
    memoryMb: 380,
    memoryLimitMb: 1024,
    ports: "3001, 2222",
    uptimeSeconds: 21 * DAY,
    restarts24h: 0,
  },
  {
    id: "c10",
    name: "opsora-web",
    image: "opsora:dev",
    state: "running",
    health: "starting",
    cpu: 1.4,
    memoryMb: 420,
    memoryLimitMb: 1024,
    ports: "3002",
    uptimeSeconds: 3 * 3_600,
    restarts24h: 4,
  },
  {
    id: "c11",
    name: "watchtower",
    image: "containrrr/watchtower:1.7",
    state: "running",
    health: "none",
    cpu: 0.1,
    memoryMb: 32,
    memoryLimitMb: 128,
    ports: "-",
    uptimeSeconds: 30 * DAY,
    restarts24h: 0,
  },
  {
    id: "c12",
    name: "homeassistant",
    image: "ghcr.io/home-assistant/home-assistant:2026.9",
    state: "running",
    health: "healthy",
    cpu: 3.2,
    memoryMb: 512,
    memoryLimitMb: 1024,
    ports: "8123",
    uptimeSeconds: 6 * DAY,
    restarts24h: 0,
  },
  {
    id: "c13",
    name: "migrate-helper",
    image: "cloud-dock/migrate:0.4.2",
    state: "exited",
    health: "none",
    cpu: 0,
    memoryMb: 0,
    memoryLimitMb: 256,
    ports: "-",
    uptimeSeconds: 0,
    restarts24h: 0,
  },
];

export function getDockerSnapshot(): DockerSnapshot {
  const now = Date.now();
  const live = containers.map((container) => {
    if (container.state !== "running") return { ...container };

    const phase = container.id.charCodeAt(1);
    return {
      ...container,
      cpu: round(
        Math.max(0.1, oscillate(container.cpu, container.cpu * 0.4, 40_000, phase, now)),
        2,
      ),
      memoryMb: round(
        Math.max(
          8,
          oscillate(container.memoryMb, container.memoryMb * 0.06, 65_000, phase, now),
        ),
        0,
      ),
    };
  });

  const running = live.filter((container) => container.state === "running");
  const restarts24h = running.reduce(
    (total, container) => total + container.restarts24h,
    0,
  );

  return {
    summary: {
      running: running.length,
      stopped: live.length - running.length,
      unhealthy: running.filter((container) => container.health === "unhealthy")
        .length,
      images: 18,
      restarts24h,
      memoryUsedMb: running.reduce(
        (total, container) => total + container.memoryMb,
        0,
      ),
    },
    containers: live,
    updatedAt: new Date(now).toISOString(),
  };
}
