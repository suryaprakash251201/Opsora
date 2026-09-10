import {
  isBefore,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import type { Todo } from "./types";
import { priorityMeta } from "./types";

export type TodoView =
  | "today"
  | "upcoming"
  | "overdue"
  | "inbox"
  | "in_progress"
  | "waiting"
  | "projects"
  | "done"
  | "all";

export const TODO_VIEWS: { value: TodoView; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "inbox", label: "Inbox" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "projects", label: "Projects" },
  { value: "done", label: "Completed" },
  { value: "all", label: "All" },
];

function sortOpen(a: Todo, b: Todo): number {
  const aDue = a.dueDate ? parseISO(a.dueDate).getTime() : Infinity;
  const bDue = b.dueDate ? parseISO(b.dueDate).getTime() : Infinity;
  if (aDue !== bDue) return aDue - bDue;
  return priorityMeta[a.priority].rank - priorityMeta[b.priority].rank;
}

export function filterTodos(todos: Todo[], view: TodoView): Todo[] {
  const today = startOfDay(new Date());
  const open = todos.filter((todo) => todo.status !== "done");

  switch (view) {
    case "today":
      return open
        .filter(
          (todo) =>
            todo.status === "today" ||
            (todo.dueDate && isToday(parseISO(todo.dueDate))),
        )
        .sort(sortOpen);
    case "upcoming":
      return open
        .filter((todo): todo is Todo & { dueDate: string } => {
          if (!todo.dueDate) return false;
          const date = parseISO(todo.dueDate);
          return !isBefore(date, today) && !isToday(date);
        })
        .sort(sortOpen);
    case "overdue":
      return open
        .filter(
          (todo) => todo.dueDate && isBefore(parseISO(todo.dueDate), today),
        )
        .sort(sortOpen);
    case "inbox":
      return open.filter((todo) => todo.status === "inbox").sort(sortOpen);
    case "in_progress":
      return open
        .filter((todo) => todo.status === "in_progress")
        .sort(sortOpen);
    case "waiting":
      return open.filter((todo) => todo.status === "waiting").sort(sortOpen);
    case "done":
      return todos
        .filter((todo) => todo.status === "done")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
    case "projects":
    case "all":
    default:
      return [...open].sort(sortOpen);
  }
}

export function collectProjects(todos: Todo[]): { name: string; open: number }[] {
  const counts = new Map<string, number>();

  for (const todo of todos) {
    if (!todo.project || todo.status === "done") continue;
    counts.set(todo.project, (counts.get(todo.project) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, open]) => ({ name, open }))
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
}

export interface TodoStats {
  open: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
  waiting: number;
  completionRate: number;
}

export function todoStats(todos: Todo[]): TodoStats {
  const today = startOfDay(new Date());
  const done = todos.filter((todo) => todo.status === "done");
  const open = todos.filter((todo) => todo.status !== "done");

  return {
    open: open.length,
    dueToday: open.filter((todo) => todo.dueDate && isToday(parseISO(todo.dueDate)))
      .length,
    overdue: todos.filter(
      (todo) =>
        todo.status !== "done" &&
        todo.dueDate &&
        isBefore(parseISO(todo.dueDate), today),
    ).length,
    completedToday: done.filter(
      (todo) => todo.completedAt && isToday(parseISO(todo.completedAt)),
    ).length,
    waiting: todos.filter((todo) => todo.status === "waiting").length,
    completionRate: todos.length
      ? Math.round((done.length / todos.length) * 100)
      : 0,
  };
}
