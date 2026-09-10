import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createJsonRepository,
  createSqliteRepository,
  normalizeTodoList,
} from "./todo-repository";
import type { Todo } from "@/features/todos/types";

function todo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "t1",
    title: "Test task",
    status: "today",
    priority: "high",
    tags: ["ops"],
    createdAt: "2026-09-10T08:00:00.000Z",
    ...overrides,
  };
}

const directories: string[] = [];

function tempFile(name: string): string {
  const directory = mkdtempSync(path.join(tmpdir(), "opsora-test-"));
  directories.push(directory);
  return path.join(directory, name);
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("normalizeTodoList", () => {
  it("drops invalid entries and coerces defaults", () => {
    const todos = normalizeTodoList([
      { id: "a", title: "Valid" },
      { id: "b" },
      { title: "no id" },
      "nope",
      null,
      { id: "c", title: "Statused", status: "weird", priority: "weird" },
    ]);

    expect(todos).toHaveLength(2);
    expect(todos[0].status).toBe("inbox");
    expect(todos[0].priority).toBe("medium");
    expect(todos[1].status).toBe("inbox");
  });

  it("returns an empty list for non-arrays", () => {
    expect(normalizeTodoList(null)).toEqual([]);
    expect(normalizeTodoList({ todos: [] })).toEqual([]);
  });

  it("keeps tags and optional fields", () => {
    const [result] = normalizeTodoList([
      {
        id: "a",
        title: "Tagged",
        tags: ["ops", 42, "review"],
        dueDate: "2026-09-12T00:00:00.000Z",
        project: "Homelab",
      },
    ]);

    expect(result.tags).toEqual(["ops", "review"]);
    expect(result.project).toBe("Homelab");
    expect(result.dueDate).toContain("2026-09-12");
  });
});

describe("sqlite repository", () => {
  it("round-trips todos and preserves order", async () => {
    const repository = createSqliteRepository(tempFile("test.db"));

    expect(repository.kind).toBe("sqlite");
    expect(await repository.read()).toEqual({ todos: [], updatedAt: null });

    const { updatedAt } = await repository.replace([
      todo({ id: "a", title: "First" }),
      todo({ id: "b", title: "Second" }),
    ]);

    expect(updatedAt).toBeTruthy();

    const snapshot = await repository.read();
    expect(snapshot.todos.map((item) => item.id)).toEqual(["a", "b"]);
    expect(snapshot.updatedAt).toBe(updatedAt);

    await repository.replace([todo({ id: "c", title: "Only" })]);
    const replaced = await repository.read();
    expect(replaced.todos).toHaveLength(1);
    expect(replaced.todos[0].title).toBe("Only");
  });
});

describe("json repository", () => {
  it("round-trips todos through a file", async () => {
    const repository = createJsonRepository(tempFile("todos.json"));

    expect(repository.kind).toBe("json");
    await repository.replace([todo({ id: "a" })]);

    const snapshot = await repository.read();
    expect(snapshot.todos).toHaveLength(1);
    expect(snapshot.updatedAt).toBeTruthy();
  });
});
