"use client";

import { useMemo, useState } from "react";
import { ListTodo, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/viz/page-header";
import { EmptyState } from "@/components/viz/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TodoItem } from "@/features/todos/todo-item";
import {
  collectProjects,
  filterTodos,
  todoStats,
  TODO_VIEWS,
  type TodoView,
} from "@/features/todos/selectors";
import { useTodoStore } from "@/features/todos/store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const statTiles = [
  { key: "open", label: "Open" },
  { key: "dueToday", label: "Due today" },
  { key: "overdue", label: "Overdue" },
  { key: "completedToday", label: "Done today" },
] as const;

export default function TodosPage() {
  const todos = useTodoStore((state) => state.todos);
  const openTodoDialog = useUiStore((state) => state.openTodoDialog);
  const [view, setView] = useState<TodoView>("today");
  const [search, setSearch] = useState("");

  const stats = todoStats(todos);
  const projects = collectProjects(todos);

  const { filtered, counts } = useMemo(() => {
    let items = filterTodos(todos, view);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      items = items.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.project?.toLowerCase().includes(query) ||
          todo.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    const viewCounts = Object.fromEntries(
      TODO_VIEWS.map((item) => [
        item.value,
        filterTodos(todos, item.value).length,
      ]),
    ) as Record<TodoView, number>;

    return { filtered: items, counts: viewCounts };
  }, [todos, view, search]);

  return (
    <>
      <PageHeader
        title="Todos"
        accent="var(--accent-todos)"
        description={
          stats.overdue > 0
            ? `${stats.open} open · ${stats.overdue} overdue · ${stats.completedToday} completed today`
            : `${stats.open} open · ${stats.dueToday} due today · ${stats.completedToday} completed today`
        }
        actions={
          <Button onClick={() => openTodoDialog(undefined, view === "today" ? "today" : "inbox")}>
            <Plus />
            New task
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statTiles.map((tile) => (
          <div
            key={tile.key}
            className="border-border bg-panel rounded-card border p-3.5 transition-all hover:border-border-strong"
          >
            <p className="text-subtle text-xs">{tile.label}</p>
            <p className="metrics mt-1.5 text-xl font-semibold tracking-tight">
              {stats[tile.key]}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="text-subtle pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter tasks…"
              className="h-9 pl-8 text-xs"
            />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Progress
              value={stats.completionRate}
              className="w-24"
              indicatorClassName="bg-success"
            />
            <span className="text-subtle text-xs">
              {stats.completionRate}% done
            </span>
          </div>
        </div>

        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {TODO_VIEWS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setView(item.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                view === item.value
                  ? "border-border-strong bg-surface text-foreground"
                  : "text-muted hover:bg-surface/60 hover:text-foreground border-transparent",
              )}
            >
              {item.label}
              {counts[item.value] > 0 ? (
                <span className="metrics text-subtle">
                  {counts[item.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {view === "projects" ? (
        projects.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No projects yet"
            description="Assign a project when creating a task and it will show up here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.name}
                type="button"
                onClick={() => {
                  setSearch(project.name);
                  setView("all");
                }}
                className="border-border bg-panel rounded-card hover:border-border-strong flex items-center justify-between border p-4 text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-subtle text-xs">
                    {project.open} open task{project.open === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="metrics text-muted text-lg font-semibold">
                  {project.open}
                </span>
              </button>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Nothing here"
          description="No tasks match this view or filter. Create one to get started."
          action={
            <Button size="sm" onClick={() => openTodoDialog(undefined, view === "today" ? "today" : "inbox")}>
              <Plus />
              New task
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2 pb-4">
          {filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onEdit={(item) => openTodoDialog(item.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
