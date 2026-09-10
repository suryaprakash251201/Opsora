export type TodoStatus =
  | "inbox"
  | "today"
  | "in_progress"
  | "waiting"
  | "done";

export type TodoPriority = "critical" | "high" | "medium" | "low";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  project?: string;
  tags: string[];
  createdAt: string;
  completedAt?: string;
}

export const TODO_STATUSES: { value: TodoStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "today", label: "Today" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

export const TODO_PRIORITIES: {
  value: TodoPriority;
  label: string;
  text: string;
  dot: string;
  rank: number;
}[] = [
  {
    value: "critical",
    label: "Critical",
    text: "text-danger",
    dot: "bg-danger",
    rank: 0,
  },
  {
    value: "high",
    label: "High",
    text: "text-warning",
    dot: "bg-warning",
    rank: 1,
  },
  {
    value: "medium",
    label: "Medium",
    text: "text-info",
    dot: "bg-info",
    rank: 2,
  },
  {
    value: "low",
    label: "Low",
    text: "text-subtle",
    dot: "bg-subtle",
    rank: 3,
  },
];

export const priorityMeta = Object.fromEntries(
  TODO_PRIORITIES.map((priority) => [priority.value, priority]),
) as Record<TodoPriority, (typeof TODO_PRIORITIES)[number]>;

export const statusLabels = Object.fromEntries(
  TODO_STATUSES.map((status) => [status.value, status.label]),
) as Record<TodoStatus, string>;
