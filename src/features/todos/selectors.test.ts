import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { filterTodos, todoStats } from "./selectors";
import type { Todo } from "./types";

function todo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: Math.random().toString(36).slice(2),
    title: "Test task",
    status: "inbox",
    priority: "medium",
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("todoStats", () => {
  it("excludes completed tasks from the due-today count", () => {
    const today = new Date().toISOString();
    const stats = todoStats([
      todo({ status: "today", dueDate: today }),
      todo({ status: "done", dueDate: today, completedAt: today }),
    ]);

    expect(stats.open).toBe(1);
    expect(stats.dueToday).toBe(1);
    expect(stats.completedToday).toBe(1);
  });

  it("counts overdue open tasks", () => {
    const stats = todoStats([
      todo({
        status: "inbox",
        dueDate: addDays(new Date(), -2).toISOString(),
      }),
      todo({
        status: "done",
        dueDate: addDays(new Date(), -2).toISOString(),
      }),
    ]);

    expect(stats.overdue).toBe(1);
  });
});

describe("filterTodos", () => {
  it("shows status-today and calendar-today tasks in the today view", () => {
    const today = new Date().toISOString();
    const todos = [
      todo({ status: "today" }),
      todo({ status: "inbox", dueDate: today }),
      todo({ status: "inbox", dueDate: addDays(new Date(), 2).toISOString() }),
    ];

    expect(filterTodos(todos, "today")).toHaveLength(2);
  });

  it("sorts completed tasks by recency", () => {
    const todos = [
      todo({
        status: "done",
        completedAt: addDays(new Date(), -3).toISOString(),
      }),
      todo({ status: "done", completedAt: new Date().toISOString() }),
    ];

    const [first] = filterTodos(todos, "done");
    expect(first.completedAt).toContain(new Date().toISOString().slice(0, 10));
  });

  it("includes completed tasks in the all view", () => {
    const todos = [
      todo({ status: "inbox" }),
      todo({ status: "in_progress" }),
      todo({ status: "done", completedAt: new Date().toISOString() }),
    ];

    const all = filterTodos(todos, "all");
    expect(all).toHaveLength(3);
    expect(all.some((item) => item.status === "done")).toBe(true);
  });

  it("keeps projects focused on open work", () => {
    const todos = [
      todo({ status: "inbox", project: "Opsora" }),
      todo({ status: "done", project: "Opsora" }),
    ];

    expect(filterTodos(todos, "projects")).toHaveLength(1);
  });
});
