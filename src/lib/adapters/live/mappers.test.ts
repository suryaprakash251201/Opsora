import { describe, expect, it } from "vitest";
import {
  computeCpuPercent,
  parseHealth,
  parseUptimeSeconds,
} from "./docker";
import { mapCi, mapLastCommit, mapPull, mapRepo } from "./github";
import {
  mapPiholeHistory,
  mapPiholeSummary,
  mapTopClients,
} from "./pihole";
import { normalizeAgentPayload } from "./agent-store";

describe("docker mapping", () => {
  it("parses uptime from status strings", () => {
    expect(parseUptimeSeconds("Up 2 days")).toBe(172_800);
    expect(parseUptimeSeconds("Up About an hour")).toBe(3_600);
    expect(parseUptimeSeconds("Up 5 minutes (healthy)")).toBe(300);
    expect(parseUptimeSeconds("Up 3 weeks")).toBe(1_814_400);
    expect(parseUptimeSeconds("Exited (0) 2 hours ago")).toBe(0);
  });

  it("parses health from status strings", () => {
    expect(parseHealth("Up 2 minutes (healthy)")).toBe("healthy");
    expect(parseHealth("Up 10 seconds (health: starting)")).toBe("starting");
    expect(parseHealth("Up 3 hours (unhealthy)")).toBe("unhealthy");
    expect(parseHealth("Up 3 hours")).toBe("none");
  });

  it("computes cpu percentage from stats deltas", () => {
    const percent = computeCpuPercent({
      cpu_stats: {
        cpu_usage: { total_usage: 300, percpu_usage: [1, 2, 3, 4] },
        system_cpu_usage: 1_000,
        online_cpus: 4,
      },
      precpu_stats: {
        cpu_usage: { total_usage: 100 },
        system_cpu_usage: 500,
      },
      memory_stats: {},
    });

    // (200 / 500) * 4 * 100 = 160% (100% per core)
    expect(percent).toBe(160);
  });
});

describe("github mapping", () => {
  it("maps workflow runs to CI states", () => {
    expect(mapCi(undefined).status).toBe("none");
    expect(
      mapCi({
        name: "ci",
        status: "completed",
        conclusion: "failure",
        updated_at: "2026-09-10T10:00:00Z",
      }).status,
    ).toBe("failing");
    expect(
      mapCi({
        name: "ci",
        status: "in_progress",
        conclusion: null,
        updated_at: "2026-09-10T10:00:00Z",
      }).status,
    ).toBe("running");
    expect(
      mapCi({
        name: "ci",
        status: "completed",
        conclusion: "success",
        updated_at: "2026-09-10T10:00:00Z",
      }).status,
    ).toBe("passing");
  });

  it("falls back when a repo has no commits", () => {
    const lastCommit = mapLastCommit(undefined);
    expect(lastCommit.sha).toBe("-------");
    expect(lastCommit.message).toBe("No commits yet");
  });

  it("maps repositories and pull requests", () => {
    const repo = mapRepo(
      {
        id: 1,
        name: "cloud-dock",
        full_name: "surya/cloud-dock",
        description: null,
        language: "TypeScript",
        stargazers_count: 12,
        forks_count: 3,
        open_issues_count: 4,
        default_branch: "main",
        archived: false,
        pushed_at: "2026-09-10T09:00:00Z",
      },
      undefined,
      undefined,
    );

    expect(repo.description).toBe("No description");
    expect(repo.ci.status).toBe("none");

    const pull = mapPull(
      {
        number: 42,
        title: "Add R2 storage",
        user: { login: "aditya" },
        created_at: "2026-09-10T08:00:00Z",
        comments: 2,
        labels: [],
        repository_url: "https://api.github.com/repos/surya/cloud-dock",
      },
      true,
      { additions: 10, deletions: 2, draft: false, head: { sha: "abc" } },
      { state: "failure" },
    );

    expect(pull.repo).toBe("cloud-dock");
    expect(pull.checks).toBe("failing");
    expect(pull.reviewRequested).toBe(true);
    expect(pull.additions).toBe(10);
  });
});

describe("pihole mapping", () => {
  it("maps v6-style and v5-style summaries", () => {
    const v6 = mapPiholeSummary({
      queries: { total: 1000, blocked: 210, percent_blocked: 21 },
      clients: { active: 12 },
      gravity: { domains_being_blocked: 180_000, last_update: 1_700_000_000 },
    });
    expect(v6.queries).toBe(1000);
    expect(v6.blockRate).toBe(21);
    expect(v6.clients).toBe(12);
    expect(v6.gravityUpdatedAt).toContain("2023");

    const v5 = mapPiholeSummary({
      dns_queries_today: 500,
      ads_blocked_today: 100,
      active_clients: 4,
    });
    expect(v5.queries).toBe(500);
    expect(v5.blockRate).toBe(20);
  });

  it("maps history arrays from either shape", () => {
    const wrapped = mapPiholeHistory({
      history: [{ timestamp: 1_700_000_000, total: 100, blocked: 20 }],
    });
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0].queries).toBe(100);

    const plain = mapPiholeHistory([
      { timestamp: 1_700_000_000, total: 50, ads: 5 },
    ]);
    expect(plain[0].blocked).toBe(5);
  });

  it("maps top clients defensively", () => {
    const clients = mapTopClients({
      clients: [
        { ip: "192.168.1.42", name: "tv", count: 900 },
        { ip: "192.168.1.21" },
      ],
    });

    expect(clients[0]).toEqual({
      name: "tv",
      ip: "192.168.1.42",
      queries: 900,
    });
    expect(clients[1].name).toBe("192.168.1.21");
    expect(clients[1].queries).toBe(0);
  });
});

describe("agent payload normalization", () => {
  it("fills defaults for a minimal payload", () => {
    const metrics = normalizeAgentPayload({ hostname: "atlas" });
    expect(metrics.hostname).toBe("atlas");
    expect(metrics.cpu.cores).toBe(1);
    expect(metrics.memory.totalBytes).toBe(1);
    expect(metrics.disks).toEqual([]);
    expect(metrics.services).toEqual([]);
  });

  it("rejects payloads without a hostname", () => {
    expect(() => normalizeAgentPayload({})).toThrow(/hostname/);
    expect(() => normalizeAgentPayload(null)).toThrow();
  });

  it("clamps array sizes and coerces values", () => {
    const metrics = normalizeAgentPayload({
      hostname: "ceres",
      cpu: { usage: "12.5", cores: 4 },
      disks: Array.from({ length: 20 }, (_, index) => ({
        mount: `/d${index}`,
        usedBytes: 1,
        totalBytes: 2,
      })),
    });

    expect(metrics.cpu.usage).toBe(0); // strings are not numbers
    expect(metrics.disks).toHaveLength(12);
  });
});
