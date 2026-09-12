"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  ArrowRight,
  CircleDashed,
  Moon,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Sun,
} from "lucide-react";
import {
  LiveAnalytics,
  LiveBell,
  LiveCalendar,
  LiveDocker,
  LiveGithub,
  LiveHome,
  LiveServer,
  LiveSettings,
  LiveShield,
  LiveTodo,
} from "@/components/icons/live";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTodoStore } from "@/features/todos/store";
import { priorityMeta, statusLabels } from "@/features/todos/types";
import { useThemeStore } from "@/stores/theme-store";
import { themeMode } from "@/lib/theme-config";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const pages = [
  { href: "/", label: "Home", icon: LiveHome },
  { href: "/todos", label: "Todos", icon: LiveTodo },
  { href: "/calendar", label: "Calendar", icon: LiveCalendar },
  { href: "/github", label: "GitHub", icon: LiveGithub },
  { href: "/docker", label: "Docker", icon: LiveDocker },
  { href: "/servers", label: "Servers", icon: LiveServer },
  { href: "/pihole", label: "Pi-hole", icon: LiveShield },
  { href: "/analytics", label: "Analytics", icon: LiveAnalytics },
  { href: "/alerts", label: "Alerts", icon: LiveBell },
  { href: "/settings", label: "Settings", icon: LiveSettings },
];

const shortcuts: Record<string, string> = {
  h: "/",
  t: "/todos",
  c: "/calendar",
  g: "/github",
  d: "/docker",
  s: "/servers",
  p: "/pihole",
  a: "/alerts",
};

const MAX_TASK_RESULTS = 8;

const itemClass =
  "group text-muted data-[selected=true]:bg-surface/90 data-[selected=true]:text-foreground data-[selected=true]:border-border/70 border border-transparent flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none select-none transition-all duration-150";
const groupClass =
  "text-subtle [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase";

export function CommandPalette() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { commandOpen, setCommandOpen, openTodoDialog } = useUiStore();
  const todos = useTodoStore((state) => state.todos);
  const theme = useThemeStore((state) => state.theme);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const toggleSidebar = useUiStore((state) => state.toggleSidebarCollapsed);

  // Clear the query whenever the palette closes so the next open starts
  // from a clean list (handled in the Dialog's onOpenChange below).

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(!useUiStore.getState().commandOpen);
        return;
      }

      // ⌘⇧L / Ctrl+Shift+L — toggle dark/light theme.
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "l"
      ) {
        event.preventDefault();
        useThemeStore.getState().toggleMode();
        return;
      }

      // ⌘\ / Ctrl+\ — toggle the sidebar. Checked before the modifier
      // guard below (which exists to keep page shortcuts from firing while
      // typing or with browser chords).
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
        event.preventDefault();
        useUiStore.getState().toggleSidebarCollapsed();
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "\\") {
        event.preventDefault();
        useUiStore.getState().toggleSidebarCollapsed();
        return;
      }

      if (event.key === "/" || (event.shiftKey && event.key === "?")) {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      const href = shortcuts[event.key.toLowerCase()];
      if (href) {
        event.preventDefault();
        router.push(href);
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openTodoDialog();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openTodoDialog, router, setCommandOpen]);

  const run = (action: () => void) => {
    setCommandOpen(false);
    action();
  };

  // Local, deterministic task matching so the "Tasks" group can disappear
  // entirely when nothing matches (cmdk hides items but not headings).
  const matchedTodos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return todos.slice(0, 5);
    return todos
      .filter((todo) => {
        const haystack = [
          todo.title,
          todo.description ?? "",
          todo.project ?? "",
          ...(todo.tags ?? []),
          statusLabels[todo.status],
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, MAX_TASK_RESULTS);
  }, [todos, search]);

  const mode = themeMode(theme);

  return (
    <Dialog
      open={commandOpen}
      onOpenChange={(open) => {
        if (!open) setSearch("");
        setCommandOpen(open);
      }}
    >
      <DialogContent className="max-w-xl p-0" showClose={false}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          loop
          className="flex flex-col overflow-hidden rounded-2xl"
          label="Command palette"
        >
          <div className="border-border/80 bg-surface/30 flex items-center gap-3 border-b px-4 py-1">
            <Search className="text-subtle size-4 shrink-0" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search (pages, tasks, sources)…"
              className="text-foreground placeholder:text-subtle h-12 w-full bg-transparent text-sm outline-none font-medium"
            />
            <kbd className="border-border/80 bg-surface/80 text-subtle rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-[22rem] overflow-y-auto p-2.5">
            <Command.Empty className="text-subtle px-3 py-6 text-center text-sm">
              No results found. Try a task title, project or page name.
            </Command.Empty>

            {matchedTodos.length > 0 ? (
              <>
                <Command.Group
                  heading={search.trim() ? "Tasks" : "Recent tasks"}
                  className={groupClass}
                >
                  {matchedTodos.map((todo) => {
                    const priority = priorityMeta[todo.priority];
                    const done = todo.status === "done";
                    return (
                      <Command.Item
                        key={todo.id}
                        value={[
                          todo.title,
                          todo.project ?? "",
                          ...(todo.tags ?? []),
                        ].join(" ")}
                        onSelect={() => run(() => openTodoDialog(todo.id))}
                        className={itemClass}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            done ? "bg-success" : priority.dot,
                          )}
                        />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate",
                            done && "text-subtle line-through",
                          )}
                        >
                          {todo.title}
                        </span>
                        {todo.project ? (
                          <span className="text-subtle hidden max-w-28 truncate text-[11px] sm:inline">
                            {todo.project}
                          </span>
                        ) : null}
                        <Badge
                          variant={done ? "success" : "outline"}
                          className="shrink-0"
                        >
                          {statusLabels[todo.status]}
                        </Badge>
                        <ArrowRight className="text-subtle size-3.5 shrink-0 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
                <Command.Separator className="bg-border my-1 h-px" />
              </>
            ) : null}

            <Command.Group heading="Navigate" className={groupClass}>
              {pages.map((page) => {
                const Icon = page.icon;
                return (
                  <Command.Item
                    key={page.href}
                    value={page.label}
                    onSelect={() => run(() => router.push(page.href))}
                    className={itemClass}
                  >
                    <Icon className="text-subtle size-4" />
                    {page.label}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Separator className="bg-border my-1 h-px" />

            <Command.Group heading="Actions" className={groupClass}>
              <Command.Item
                value="New todo task"
                onSelect={() => run(() => openTodoDialog())}
                className={itemClass}
              >
                <Plus className="text-subtle size-4" />
                New task
                <kbd className="border-border bg-background/50 ml-auto rounded border px-1 font-mono text-[10px]">
                  N
                </kbd>
              </Command.Item>
              <Command.Item
                value="Toggle theme dark light"
                onSelect={() => run(() => toggleMode())}
                className={itemClass}
              >
                {mode === "dark" ? (
                  <Sun className="text-subtle size-4" />
                ) : (
                  <Moon className="text-subtle size-4" />
                )}
                Switch to {mode === "dark" ? "light" : "dark"} theme
                <kbd className="border-border bg-background/50 ml-auto rounded border px-1 font-mono text-[10px]">
                  ⌘⇧L
                </kbd>
              </Command.Item>
              <Command.Item
                value="Toggle sidebar collapse expand"
                onSelect={() => run(() => toggleSidebar())}
                className={itemClass}
              >
                <PanelLeft className="text-subtle size-4" />
                Toggle sidebar
                <kbd className="border-border bg-background/50 ml-auto rounded border px-1 font-mono text-[10px]">
                  ⌘\
                </kbd>
              </Command.Item>
              <Command.Item
                value="Refresh data reload sources"
                onSelect={() =>
                  run(() => {
                    void queryClient.invalidateQueries();
                  })
                }
                className={itemClass}
              >
                <RefreshCw className="text-subtle size-4" />
                Refresh data
              </Command.Item>
              {todos.length === 0 ? (
                <Command.Item
                  value="No tasks yet"
                  disabled
                  className={cn(itemClass, "opacity-60")}
                >
                  <CircleDashed className="text-subtle size-4" />
                  No tasks yet — press N to add one
                </Command.Item>
              ) : null}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
