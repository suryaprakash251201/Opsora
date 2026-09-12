"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { LiveTodo } from "@/components/icons/live";
import { PageHeader } from "@/components/viz/page-header";
import { EmptyState } from "@/components/viz/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatTile } from "@/components/viz/stat-tile";
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
        <StatTile
          label="Open tasks"
          value={stats.open}
          accent="var(--brand)"
        />
        <StatTile
          label="Due today"
          value={stats.dueToday}
          accent="var(--accent-todos)"
        />
        <StatTile
          label="Overdue"
          value={stats.overdue}
          accent={stats.overdue > 0 ? "var(--danger)" : "var(--muted)"}
        />
        <StatTile
          label="Completed today"
          value={stats.completedToday}
          accent="var(--success)"
          footer={`${stats.completionRate}% total completion`}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, projects, #tags…"
              className="h-9.5 pl-9 text-xs rounded-xl border-border/80 bg-panel/80 focus-visible:border-border-strong shadow-2xs"
            />
          </div>
          <div className="hidden items-center gap-2.5 sm:flex bg-panel/70 border border-border/70 rounded-xl px-3 py-1.5 shadow-2xs">
            <Progress
              value={stats.completionRate}
              className="w-24 h-2 bg-surface"
              indicatorClassName="bg-success"
            />
            <span className="metrics text-subtle text-xs font-semibold">
              {stats.completionRate}% done
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto p-1 bg-surface/50 border border-border/60 rounded-2xl backdrop-blur-sm">
          {TODO_VIEWS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setView(item.value)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer",
                view === item.value
                  ? "bg-panel text-foreground shadow-xs border border-border/80"
                  : "text-muted hover:text-foreground hover:bg-surface/80 border border-transparent",
              )}
            >
              {item.label}
              {counts[item.value] > 0 ? (
                <span
                  className={cn(
                    "metrics rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    view === item.value
                      ? "bg-surface text-foreground"
                      : "bg-surface/80 text-subtle",
                  )}
                >
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
            icon={LiveTodo}
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
          icon={LiveTodo}
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
