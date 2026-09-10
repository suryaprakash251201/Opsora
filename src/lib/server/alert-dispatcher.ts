import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllSnapshots } from "@/lib/adapters";
import { evaluateAttention } from "@/lib/attention/engine";
import type { AttentionItem, Severity } from "@/lib/attention/types";
import { getTodoRepository } from "@/lib/server/todo-repository";
import { sendToChannels, type ChannelSendResult } from "./alert-channels";

const MAX_SEEN = 500;
const MAX_PER_RUN = 5;

const severityIcon: Record<Severity, string> = {
  critical: "🔴",
  warning: "🟠",
  info: "🔵",
  success: "🟢",
};

export function formatAlertText(
  item: AttentionItem,
  baseUrl = process.env.OPSORA_PUBLIC_URL ?? "http://localhost:3000",
): string {
  const lines = [`${severityIcon[item.severity]} Opsora · ${item.title}`];
  if (item.detail) lines.push(item.detail);
  if (item.context) lines.push(`· ${item.context}`);
  lines.push(`${baseUrl.replace(/\/$/, "")}${item.href}`);
  return lines.join("\n");
}

export function selectFreshAlerts(
  items: AttentionItem[],
  seenIds: string[],
  level: "attention" | "all" = "attention",
): { fresh: AttentionItem[]; nextSeen: string[] } {
  const eligible = items.filter(
    (item) =>
      level === "all" ||
      item.severity === "critical" ||
      item.severity === "warning",
  );

  const seen = new Set(seenIds);
  const fresh = eligible.filter((item) => !seen.has(item.id));
  const nextSeen = [...new Set([...seenIds, ...eligible.map((item) => item.id)])].slice(
    -MAX_SEEN,
  );

  return { fresh, nextSeen };
}

function stateFile(): string {
  const dir = process.env.OPSORA_DATA_DIR ?? path.join(process.cwd(), ".data");
  return path.join(dir, "alerts-seen.json");
}

let seenIds: string[] | null = null;
let seeded = false;
let started = false;
let running = false;

async function loadSeen(): Promise<string[]> {
  if (seenIds) return seenIds;

  try {
    const parsed = JSON.parse(await readFile(stateFile(), "utf8")) as unknown;
    seenIds = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
    seeded = true;
  } catch {
    // First run: seed without notifying so the channel isn't flooded.
    seenIds = [];
    seeded = false;
  }

  return seenIds;
}

async function persistSeen(ids: string[]): Promise<void> {
  try {
    await mkdir(path.dirname(stateFile()), { recursive: true });
    await writeFile(stateFile(), JSON.stringify(ids, null, 2), "utf8");
  } catch {
    // Best effort; alerts continue from memory.
  }
}

export interface AlertRunResult {
  evaluated: number;
  fresh: number;
  results: ChannelSendResult[];
}

export async function runAlertCheck(): Promise<AlertRunResult> {
  const [sources, todoSnapshot] = await Promise.all([
    getAllSnapshots(),
    getTodoRepository().read(),
  ]);

  const items = evaluateAttention({
    servers: sources.servers.data,
    github: sources.github.data,
    pihole: sources.pihole.data,
    docker: sources.docker.data,
    calendar: sources.calendar.data,
    todos: todoSnapshot.todos,
  });

  const current = await loadSeen();

  if (!seeded) {
    seenIds = current;
    seeded = true;
    const { nextSeen } = selectFreshAlerts(items, seenIds);
    seenIds = nextSeen;
    await persistSeen(nextSeen);
    return { evaluated: items.length, fresh: 0, results: [] };
  }

  const level =
    process.env.OPSORA_ALERT_LEVEL?.trim().toLowerCase() === "all"
      ? "all"
      : "attention";
  const { fresh, nextSeen } = selectFreshAlerts(items, current, level);

  seenIds = nextSeen;
  await persistSeen(nextSeen);

  const results: ChannelSendResult[] = [];
  for (const item of fresh.slice(0, MAX_PER_RUN)) {
    results.push(...(await sendToChannels(formatAlertText(item))));
  }

  return { evaluated: items.length, fresh: fresh.length, results };
}

export async function sendTestAlert(): Promise<ChannelSendResult[]> {
  return sendToChannels(
    "🟢 Opsora · Test notification\nAlert channels are configured correctly.",
  );
}

/** Starts the background alert loop; safe to call multiple times. */
export function startAlertDispatcher(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (started || process.env.OPSORA_ALERTS?.trim() === "0") return;
  started = true;

  const intervalMs = Math.max(
    15_000,
    Number(process.env.OPSORA_ALERT_INTERVAL ?? 60_000) || 60_000,
  );

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runAlertCheck();
    } catch (error) {
      console.error("[opsora:alerts]", error);
    } finally {
      running = false;
    }
  };

  setTimeout(() => {
    void tick();
  }, 10_000);
  setInterval(() => {
    void tick();
  }, intervalMs).unref?.();
}
