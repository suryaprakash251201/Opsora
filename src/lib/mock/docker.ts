export interface DockerContainer {
  id: string;  name: string;
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

