#!/usr/bin/env node
/**
 * Opsora agent — collect Linux metrics and POST them to the dashboard.
 *
 * Usage:
 *   node agent/opsora-agent.mjs --once
 *   OPSORA_INTERVAL=30 node agent/opsora-agent.mjs
 *
 * Environment:
 *   OPSORA_URL       dashboard base URL        (default http://localhost:9942)
 *   OPSORA_INTERVAL  seconds between reports   (default 30, 0 = once)
 *   OPSORA_TOKEN     shared secret             (must match OPSORA_AGENT_TOKEN)
 *   OPSORA_ROLE      human label for this host (default "Monitored host")
 *   OPSORA_HOSTNAME  override hostname         (default os.hostname())
 *   OPSORA_SERVICES  comma-separated systemd units to report
 */

import os from "node:os";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

const url = (process.env.OPSORA_URL ?? "http://localhost:9942").replace(/\/$/, "");
const interval = Number(process.env.OPSORA_INTERVAL ?? 30);
const token = process.env.OPSORA_TOKEN ?? "";
const role = process.env.OPSORA_ROLE ?? "Monitored host";
const hostname = process.env.OPSORA_HOSTNAME ?? os.hostname();
const services = (process.env.OPSORA_SERVICES ?? "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

const once = process.argv.includes("--once") || interval <= 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readCpuTimes() {
  const stat = await readFile("/proc/stat", "utf8");
  const line = stat.split("\n").find((entry) => entry.startsWith("cpu "));
  if (!line) return { total: 0, idle: 0 };

  const parts = line.trim().split(/\s+/).slice(1).map(Number);
  const total = parts.reduce((sum, value) => sum + value, 0);
  const idle = parts[3] + (parts[4] ?? 0);
  return { total, idle };
}

async function readNetwork() {
  const content = await readFile("/proc/net/dev", "utf8");
  const result = { rxBytes: 0, txBytes: 0, packets: 0 };

  for (const line of content.split("\n").slice(2)) {
    const [rawName, rawStats] = line.split(":");
    if (!rawName || !rawStats) continue;
    const name = rawName.trim();
    if (name === "lo" || name.startsWith("veth") || name.startsWith("docker"))
      continue;

    const fields = rawStats.trim().split(/\s+/).map(Number);
    result.rxBytes += fields[0] ?? 0;
    result.txBytes += fields[8] ?? 0;
    result.packets += (fields[1] ?? 0) + (fields[9] ?? 0);
  }

  return result;
}

async function readMemory() {
  const meminfo = await readFile("/proc/meminfo", "utf8");
  const values = new Map();

  for (const line of meminfo.split("\n")) {
    const [key, raw] = line.split(":");
    if (!key || !raw) continue;
    values.set(key.trim(), Number(raw.trim().split(/\s+/)[0]) * 1024);
  }

  const total = values.get("MemTotal") ?? 0;
  const available = values.get("MemAvailable") ?? values.get("MemFree") ?? 0;
  return { totalBytes: total, usedBytes: Math.max(0, total - available) };
}

async function readDisks() {
  try {
    const { stdout } = await exec("df", [
      "-kP",
      "-x",
      "tmpfs",
      "-x",
      "devtmpfs",
      "-x",
      "squashfs",
      "-x",
      "overlay",
    ]);

    return stdout
      .split("\n")
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter((fields) => fields.length >= 6)
      .slice(0, 8)
      .map((fields) => ({
        mount: fields[5],
        totalBytes: Number(fields[1]) * 1024,
        usedBytes: Number(fields[2]) * 1024,
      }))
      .filter((disk) => disk.totalBytes > 0);
  } catch {
    return [];
  }
}

async function readTemperature() {
  try {
    const zones = [0, 1, 2, 3];
    const readings = await Promise.all(
      zones.map(async (zone) => {
        try {
          const raw = await readFile(
            `/sys/class/thermal/thermal_zone${zone}/temp`,
            "utf8",
          );
          return Number(raw.trim()) / 1000;
        } catch {
          return 0;
        }
      }),
    );
    return Number(Math.max(...readings, 0).toFixed(1));
  } catch {
    return 0;
  }
}

async function readProcesses(totalMemoryBytes) {
  try {
    const { stdout } = await exec("ps", [
      "-eo",
      "comm=,pcpu=,rss=",
      "--sort=-pcpu",
    ]);

    return stdout
      .split("\n")
      .filter(Boolean)
      .slice(0, 5)
      .map((line) => {
        const [name, cpu, rss] = line.trim().split(/\s+/);
        return {
          name: name ?? "process",
          cpu: Number(cpu ?? 0),
          memoryMb: Number(rss ?? 0) / 1024,
        };
      })
      .filter((process) => Number.isFinite(process.cpu));
  } catch {
    return [];
  }
}

async function readServiceStates() {
  if (services.length === 0) return [];

  return Promise.all(
    services.map(async (name) => {
      try {
        const { stdout } = await exec("systemctl", ["is-active", name]);
        const state = stdout.trim();
        return {
          name,
          label: name,
          status:
            state === "active"
              ? "running"
              : state === "failed"
                ? "stopped"
                : "degraded",
        };
      } catch {
        return { name, label: name, status: "degraded" };
      }
    }),
  );
}

async function readOsName() {
  try {
    const release = await readFile("/etc/os-release", "utf8");
    const match = release.match(/^PRETTY_NAME="?([^"\n]+)"?/m);
    if (match) return `${match[1]} · ${os.arch()}`;
  } catch {
    // fall through
  }
  return `${os.type()} ${os.release()} · ${os.arch()}`;
}

async function measureLatency() {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_000);
    await fetch(url, { signal: controller.signal, method: "HEAD" });
    clearTimeout(timer);
  } catch {
    // ignore, latency stays 0
  }
  return Number((performance.now() - started).toFixed(1));
}

async function collect() {
  const cpuBefore = await readCpuTimes();
  const netBefore = await readNetwork();
  await sleep(1_000);
  const cpuAfter = await readCpuTimes();
  const netAfter = await readNetwork();

  const totalDelta = cpuAfter.total - cpuBefore.total;
  const idleDelta = cpuAfter.idle - cpuBefore.idle;
  const usage =
    totalDelta > 0 ? Number((((totalDelta - idleDelta) / totalDelta) * 100).toFixed(1)) : 0;

  const memory = await readMemory();
  const load = os.loadavg();
  const [disks, temperature, processes, serviceStates, osName, latencyMs] =
    await Promise.all([
      readDisks(),
      readTemperature(),
      readProcesses(memory.totalBytes),
      readServiceStates(),
      readOsName(),
      measureLatency(),
    ]);

  return {
    hostname,
    os: osName,
    role,
    uptimeSeconds: os.uptime(),
    cpu: {
      usage,
      load1: load[0],
      load5: load[1],
      load15: load[2],
      temperatureC: temperature,
      cores: os.cpus().length,
    },
    memory,
    disks,
    network: {
      rxMbps: Number((((netAfter.rxBytes - netBefore.rxBytes) * 8) / 1e6).toFixed(2)),
      txMbps: Number((((netAfter.txBytes - netBefore.txBytes) * 8) / 1e6).toFixed(2)),
      latencyMs,
      packets: netAfter.packets,
    },
    services: serviceStates,
    processes,
  };
}

async function report() {
  const payload = await collect();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["x-opsora-token"] = token;

  const response = await fetch(`${url}/api/agent`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Agent report rejected: ${response.status} ${await response.text()}`,
    );
  }

  console.log(
    `[opsora-agent] reported ${payload.hostname} · cpu ${payload.cpu.usage}% · ` +
      `mem ${(payload.memory.usedBytes / 1024 ** 3).toFixed(1)} GiB`,
  );
}

async function main() {
  if (once) {
    await report();
    return;
  }

  console.log(
    `[opsora-agent] reporting to ${url} every ${interval}s as ${hostname}`,
  );

  let running = true;
  const stop = () => {
    running = false;
    console.log("[opsora-agent] stopping");
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (running) {
    try {
      await report();
    } catch (error) {
      console.error(`[opsora-agent] ${error.message}`);
    }
    await sleep(interval * 1000);
  }
}

main().catch((error) => {
  console.error(`[opsora-agent] fatal: ${error.message}`);
  process.exit(1);
});
