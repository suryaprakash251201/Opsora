"use client";

import {
  Cpu,
  HardDrive,
  Thermometer,
  Wifi,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/viz/meter";
import { Ring, toneForValue } from "@/components/viz/ring";
import { Sparkline } from "@/components/viz/sparkline";
import { StatusDot } from "@/components/viz/status-dot";
import type { Server } from "@/lib/types/servers";
import {
  formatBytes,
  formatDuration,
  formatPercent,
  timeAgo,
} from "@/lib/format";
import { cn } from "@/lib/utils";

function OfflineCard({ server }: { server: Server }) {
  return (
    <article className="border-danger/20 bg-panel rounded-card flex flex-col gap-3 border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            {server.name}
            <StatusDot status="critical" />
          </h3>
          <p className="text-subtle text-xs">
            {server.role} · {server.host}
          </p>
        </div>
        <Badge variant="danger">unreachable</Badge>
      </div>
      <p className="text-muted text-xs">
        Last heartbeat {timeAgo(server.updatedAt)} · check Tailscale or the
        machine&apos;s power state.
      </p>
      <div className="text-subtle flex items-center gap-3 text-xs">
        <span>{server.os}</span>
      </div>
    </article>
  );
}

export function ServerCard({ server }: { server: Server }) {
  if (!server.online) return <OfflineCard server={server} />;

  const memoryPercent =
    (server.memory.usedBytes / server.memory.totalBytes) * 100;
  const degradedService = server.services.some(
    (service) => service.status === "degraded",
  );

  return (
    <article className="card-elevated group/server relative overflow-hidden rounded-2xl border border-border/80 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: "var(--accent-servers)",
          boxShadow: "0 1px 8px var(--accent-servers)",
        }}
      />
      <header className="border-b border-border/70 bg-surface/30 flex items-start justify-between gap-3 px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2.5 text-[14px] font-bold text-foreground tracking-tight">
            {server.name}
            <StatusDot status={degradedService ? "warning" : "healthy"} pulse={degradedService} />
          </h3>
          <p className="text-subtle truncate text-xs font-medium mt-0.5">
            {server.role} · <span className="font-mono text-[11px]">{server.host}</span>
          </p>
        </div>
        <div className="text-subtle shrink-0 text-right text-[11px]">
          <p className="font-semibold text-foreground/80">{server.os}</p>
          <p className="metrics text-subtle mt-0.5">
            up {formatDuration(server.uptimeSeconds)}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-4">
          <Ring
            value={server.cpu.usage}
            tone={toneForValue(server.cpu.usage, [75, 90])}
            size={68}
          />

          <div className="flex flex-col gap-1">
            <p className="text-muted flex items-center gap-1.5 text-xs font-medium">
              <Cpu className="text-subtle size-3.5" />
              CPU Usage
            </p>
            <p className="metrics text-xl leading-none font-bold text-foreground">
              {formatPercent(server.cpu.usage)}
            </p>
            <p className="text-subtle metrics text-[11px]">
              load {server.cpu.load1} / {server.cpu.cores} cores
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Meter
              label="Memory"
              value={memoryPercent}
              detail={`${formatBytes(server.memory.usedBytes)} / ${formatBytes(server.memory.totalBytes)}`}
              thresholds={[80, 92]}
            />
            {server.disks.map((disk) => {
              const percent = (disk.usedBytes / disk.totalBytes) * 100;
              return (
                <Meter
                  key={disk.mount}
                  label={`Disk ${disk.mount}`}
                  value={percent}
                  detail={`${formatBytes(disk.usedBytes)} / ${formatBytes(disk.totalBytes)}`}
                  thresholds={[80, 90]}
                />
              );
            })}
          </div>
        </div>

        <div className="border-t border-border/70 grid grid-cols-2 gap-2.5 pt-3.5 sm:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-surface/40 p-2.5">
            <p className="text-subtle flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
              <ArrowDownRight className="size-3 text-info" /> Down
            </p>
            <p className="metrics mt-1 text-xs font-bold text-foreground">
              {server.network.rxMbps} <span className="font-normal text-[10px] text-muted">Mbps</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/40 p-2.5">
            <p className="text-subtle flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
              <ArrowUpRight className="size-3 text-success" /> Up
            </p>
            <p className="metrics mt-1 text-xs font-bold text-foreground">
              {server.network.txMbps} <span className="font-normal text-[10px] text-muted">Mbps</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/40 p-2.5">
            <p className="text-subtle flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
              <Wifi className="size-3 text-brand" /> Latency
            </p>
            <p className="metrics mt-1 text-xs font-bold text-foreground">
              {server.network.latencyMs} <span className="font-normal text-[10px] text-muted">ms</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/40 p-2.5">
            <p className="text-subtle flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
              <Thermometer className="size-3 text-warning" /> Temp
            </p>
            <p
              className={cn(
                "metrics mt-1 text-xs font-bold",
                server.cpu.temperatureC >= 70 ? "text-warning" : "text-foreground",
              )}
            >
              {server.cpu.temperatureC > 0
                ? `${server.cpu.temperatureC}°C`
                : "—"}
            </p>
          </div>
        </div>

        <div className="border-border/60 border-t pt-3">
          <p className="text-subtle mb-1.5 text-[11px]">CPU · last 48 samples</p>
          <Sparkline
            data={server.history.cpu}
            height={36}
            className="text-info h-9 w-full"
          />
        </div>

        <div className="border-border/60 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2">
          <div>
            <p className="text-subtle mb-1.5 text-[11px]">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {server.services.map((service) => (
                <Badge
                  key={service.name}
                  variant={
                    service.status === "running"
                      ? "success"
                      : service.status === "degraded"
                        ? "warning"
                        : "default"
                  }
                >
                  {service.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-subtle mb-1.5 flex items-center gap-1 text-[11px]">
              <HardDrive className="size-3" /> Top processes
            </p>
            <ul className="flex flex-col gap-1">
              {server.processes.slice(0, 3).map((process) => (
                <li
                  key={process.name}
                  className="metrics flex items-center justify-between text-[11px]"
                >
                  <span className="text-muted truncate">{process.name}</span>
                  <span className="text-subtle shrink-0 pl-2">
                    {process.cpu}% · {formatBytes(process.memoryMb * 1024 * 1024)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
