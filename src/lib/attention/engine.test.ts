import { describe, expect, it } from "vitest";
import { addDays, subDays } from "date-fns";
import {
  evaluateAttention,
  overallHealth,
  summarizeAttention,
} from "./engine";
import { getServersSnapshot } from "@/lib/mock/servers";
import { getGithubSnapshot } from "@/lib/mock/github";
import { getPiholeSnapshot } from "@/lib/mock/pihole";
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

describe("evaluateAttention · servers", () => {
  it("flags critically full disks", () => {
    const items = evaluateAttention({ servers: getServersSnapshot() });
    const disk = items.find((item) => item.id === "server-disk-atlas-/");

    expect(disk).toBeDefined();
    expect(disk?.severity).toBe("critical");
    expect(disk?.meta).toBe("91%");
  });

  it("flags unreachable machines", () => {
    const items = evaluateAttention({ servers: getServersSnapshot() });
    const offline = items.find((item) => item.id === "server-offline-vega");

    expect(offline).toBeDefined();
    expect(offline?.severity).toBe("critical");
    expect(offline?.title).toContain("unreachable");
  });
});

describe("evaluateAttention · github", () => {
  it("flags failing CI and requested reviews", () => {
    const items = evaluateAttention({ github: getGithubSnapshot() });

    expect(
      items.find((item) => item.id === "github-ci-cloud-dock")?.severity,
    ).toBe("critical");
    expect(
      items.find((item) => item.id === "github-review-cloud-dock-42")?.severity,
    ).toBe("warning");
  });

  it("does not flag drafts awaiting review", () => {
    const items = evaluateAttention({ github: getGithubSnapshot() });
    const draft = items.find((item) => item.id === "github-review-opsora-7");

    expect(draft).toBeUndefined();
  });
});

describe("evaluateAttention · pihole", () => {
  it("detects anomalous client traffic", () => {
    const items = evaluateAttention({ pihole: getPiholeSnapshot() });
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
      servers: getServersSnapshot(),
      github: getGithubSnapshot(),
      pihole: getPiholeSnapshot(),
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
    const items = evaluateAttention({ github: getGithubSnapshot() });
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
