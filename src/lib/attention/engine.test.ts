import { describe, expect, it } from "vitest";
import { addDays, subDays } from "date-fns";
import {
  evaluateAttention,
  overallHealth,
  summarizeAttention,
} from "./engine";
import type { ServersSnapshot } from "@/lib/types/servers";
import type { GithubSnapshot } from "@/lib/types/github";
import type { PiholeSnapshot } from "@/lib/types/pihole";
import type { Todo } from "@/features/todos/types";

function todo(overrides: Partial<Todo>): Todo {
  return {
    id: "t1",
    title: "Test task",
    status: "inbox",
    priority: "medium",
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const servers: ServersSnapshot = {
  servers: [
    {
      id: "atlas",
      name: "atlas",
      host: "atlas.lan",
      role: "Primary homelab server",
      os: "Debian 12 · x86_64",
      online: true,
      uptimeSeconds: 12 * 86_400,
      updatedAt: new Date().toISOString(),
      cpu: { usage: 23, load1: 0.72, load5: 0.64, load15: 0.58, temperatureC: 48, cores: 8 },
      memory: { usedBytes: 7.4 * 1024 ** 3, totalBytes: 16 * 1024 ** 3 },
      disks: [
        // 91.2% full — the critical case.
        { mount: "/", usedBytes: 97.4 * 1024 ** 3, totalBytes: 106.8 * 1024 ** 3 },
      ],
      network: { rxMbps: 412, txMbps: 86, latencyMs: 0.4, packets: 2_214_882 },
      processes: [{ name: "dockerd", cpu: 8.2, memoryMb: 412 }],
      services: [{ name: "docker", label: "Docker", status: "running" }],
      history: { cpu: [24, 22], memory: [46, 47], network: [380, 412] },
    },
    {
      id: "vega",
      name: "vega",
      host: "vega.opsora.dev",
      role: "Edge VPS",
      os: "Ubuntu 24.04 · x86_64",
      online: false,
      uptimeSeconds: 0,
      updatedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      cpu: { usage: 0, load1: 0, load5: 0, load15: 0, temperatureC: 0, cores: 2 },
      memory: { usedBytes: 0, totalBytes: 4 * 1024 ** 3 },
      disks: [],
      network: { rxMbps: 0, txMbps: 0, latencyMs: 0, packets: 0 },
      processes: [],
      services: [],
      history: { cpu: [], memory: [], network: [] },
    },
  ],
  summary: {
    online: 1,
    total: 2,
    cpuAvg: 23,
    memoryUsedBytes: 7.4 * 1024 ** 3,
    memoryTotalBytes: 16 * 1024 ** 3,
    diskAvg: 91.2,
  },
  updatedAt: new Date().toISOString(),
};

const github: GithubSnapshot = {
  user: { login: "surya", name: "Surya" },
  stats: { repos: 2, openPulls: 2, openIssues: 2, commitsToday: 7 },
  repos: [
    {
      id: "cloud-dock",
      name: "cloud-dock",
      description: "Self-hosted file sync",
      language: "TypeScript",
      stars: 128,
      forks: 14,
      openIssues: 3,
      openPulls: 2,
      defaultBranch: "main",
      lastCommit: {
        message: "feat: add R2 upload",
        sha: "a3f91c2",
        author: "surya",
        at: new Date().toISOString(),
      },
      ci: { status: "failing", workflow: "ci.yml · test", at: new Date().toISOString() },
      deployment: { status: "none", environment: "-", at: new Date().toISOString() },
    },
    {
      id: "opsora",
      name: "opsora",
      description: "Command center",
      language: "TypeScript",
      stars: 12,
      forks: 2,
      openIssues: 1,
      openPulls: 1,
      defaultBranch: "main",
      lastCommit: {
        message: "feat: attention feed",
        sha: "7c2e04b",
        author: "surya",
        at: new Date().toISOString(),
      },
      ci: { status: "passing", workflow: "ci.yml", at: new Date().toISOString() },
      deployment: { status: "none", environment: "-", at: new Date().toISOString() },
    },
  ],
  pulls: [
    {
      id: 42,
      repo: "cloud-dock",
      title: "Add R2 storage backend",
      author: "aditya",
      draft: false,
      reviewRequested: true,
      checks: "passing",
      additions: 486,
      deletions: 92,
      createdAt: new Date().toISOString(),
    },
    {
      id: 7,
      repo: "opsora",
      title: "Attention engine v0.1",
      author: "surya",
      draft: true,
      reviewRequested: false,
      checks: "passing",
      additions: 912,
      deletions: 40,
      createdAt: new Date().toISOString(),
    },
  ],
  issues: [
    {
      id: 63,
      repo: "cloud-dock",
      title: "Snapshot upload fails on large files",
      author: "aditya",
      labels: ["bug", "priority: high"],
      comments: 4,
      createdAt: new Date().toISOString(),
    },
  ],
  activity: [],
  updatedAt: new Date().toISOString(),
};

const pihole: PiholeSnapshot = {
  summary: {
    queries: 42_000,
    blocked: 9_000,
    blockRate: 21.4,
    clients: 14,
    domains: 1_842,
    upstreamStatus: "healthy",
    latencyMs: 18,
    gravityUpdatedAt: new Date().toISOString(),
  },
  history: [],
  topClients: [
    { name: "tv-living-room", ip: "192.168.1.42", queries: 13_500 },
    { name: "surya-macbook", ip: "192.168.1.21", queries: 5_120 },
    { name: "iphone", ip: "192.168.1.34", queries: 4_380 },
    { name: "work-laptop", ip: "192.168.1.57", queries: 3_940 },
    { name: "nas", ip: "192.168.1.10", queries: 2_810 },
    { name: "atlas", ip: "192.168.1.2", queries: 2_140 },
    { name: "esp32", ip: "192.168.1.88", queries: 1_120 },
  ],
  topBlocked: [],
  topPermitted: [],
  updatedAt: new Date().toISOString(),
};

describe("evaluateAttention · servers", () => {
  it("flags critically full disks", () => {
    const items = evaluateAttention({ servers });
    const disk = items.find((item) => item.id === "server-disk-atlas-/");

    expect(disk).toBeDefined();
    expect(disk?.severity).toBe("critical");
    expect(disk?.meta).toBe("91%");
  });

  it("flags unreachable machines", () => {
    const items = evaluateAttention({ servers });
    const offline = items.find((item) => item.id === "server-offline-vega");

    expect(offline).toBeDefined();
    expect(offline?.severity).toBe("critical");
    expect(offline?.title).toContain("unreachable");
  });
});

describe("evaluateAttention · github", () => {
  it("flags failing CI and requested reviews", () => {
    const items = evaluateAttention({ github });

    expect(
      items.find((item) => item.id === "github-ci-cloud-dock")?.severity,
    ).toBe("critical");
    expect(
      items.find((item) => item.id === "github-review-cloud-dock-42")?.severity,
    ).toBe("warning");
  });

  it("does not flag drafts awaiting review", () => {
    const items = evaluateAttention({ github });
    const draft = items.find((item) => item.id === "github-review-opsora-7");

    expect(draft).toBeUndefined();
  });
});

describe("evaluateAttention · pihole", () => {
  it("detects anomalous client traffic", () => {
    const items = evaluateAttention({ pihole });
    const anomaly = items.find((item) => item.id === "pihole-client-192.168.1.42");

    expect(anomaly).toBeDefined();
    expect(anomaly?.severity).toBe("warning");
    expect(anomaly?.title).toContain("×");
  });
});

describe("evaluateAttention · todos", () => {
  it("aggregates overdue, due today, and completed tasks", () => {
    const todos: Todo[] = [
      todo({
        id: "a",
        title: "Overdue thing",
        dueDate: subDays(new Date(), 2).toISOString(),
      }),
      todo({
        id: "b",
        title: "Due today thing",
        status: "today",
        dueDate: new Date().toISOString(),
      }),
      todo({
        id: "c",
        title: "Finished thing",
        status: "done",
        completedAt: new Date().toISOString(),
      }),
    ];

    const items = evaluateAttention({ todos });
    const ids = items.map((item) => item.id);

    expect(ids).toContain("todos-overdue");
    expect(ids).toContain("todos-due-today");
    expect(ids).toContain("todos-completed");
  });

  it("ignores completed tasks with future due dates", () => {
    const items = evaluateAttention({
      todos: [
        todo({
          id: "a",
          status: "done",
          dueDate: addDays(new Date(), 3).toISOString(),
        }),
      ],
    });

    expect(items.find((item) => item.id === "todos-overdue")).toBeUndefined();
    expect(items.find((item) => item.id === "todos-due-today")).toBeUndefined();
  });
});

describe("evaluateAttention · ranking", () => {
  it("sorts by score with critical first", () => {
    const items = evaluateAttention({
      servers,
      github,
      pihole,
      todos: [
        todo({ id: "a", dueDate: subDays(new Date(), 1).toISOString() }),
      ],
    });

    expect(items.length).toBeGreaterThan(0);
    expect(items[0].severity).toBe("critical");

    for (let index = 1; index < items.length; index += 1) {
      expect(items[index - 1].score).toBeGreaterThanOrEqual(items[index].score);
    }
  });

  it("summarizes severities and overall health", () => {
    const items = evaluateAttention({ github });
    const summary = summarizeAttention(items);

    expect(summary.critical).toBeGreaterThan(0);
    expect(summary.needsAttention).toBe(summary.critical + summary.warning);
    expect(overallHealth(items)).toBe("critical");
  });

  it("reports healthy when there are no warnings or criticals", () => {
    expect(overallHealth([])).toBe("healthy");
    expect(
      overallHealth([
        {
          id: "ok",
          source: "docker",
          severity: "success",
          title: "All good",
          href: "/",
          score: 10,
          createdAt: new Date().toISOString(),
        },
      ]),
    ).toBe("healthy");
  });
});
