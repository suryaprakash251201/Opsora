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
