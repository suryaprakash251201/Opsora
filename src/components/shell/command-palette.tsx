"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  Container,
  House,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/github";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUiStore } from "@/stores/ui-store";

const pages = [
  { href: "/", label: "Home", icon: House },
  { href: "/todos", label: "Todos", icon: ListTodo },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/github", label: "GitHub", icon: GitHubIcon },
  { href: "/docker", label: "Docker", icon: Container },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/pihole", label: "Pi-hole", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
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

export function CommandPalette() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { commandOpen, setCommandOpen, openTodoDialog } = useUiStore();

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

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "\\") {
        event.preventDefault();
        useUiStore.getState().toggleSidebarCollapsed();
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      const href = shortcuts[event.key.toLowerCase()];
      if (href) {
        event.preventDefault();
        router.push(href);
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

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent className="max-w-xl p-0" showClose={false}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          loop
          className="flex flex-col overflow-hidden rounded-xl"
          label="Command palette"
        >
          <div className="border-border/70 flex items-center gap-2 border-b px-3.5">
            <Search className="text-subtle size-4 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Search pages and actions…"
              className="text-foreground placeholder:text-subtle h-11 w-full bg-transparent text-sm outline-none"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="text-subtle px-3 py-6 text-center text-sm">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Navigate"
              className="text-subtle [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase"
            >
              {pages.map((page) => {
                const Icon = page.icon;
                return (
                  <Command.Item
                    key={page.href}
                    value={page.label}
                    onSelect={() => run(() => router.push(page.href))}
                    className="text-muted data-[selected=true]:bg-surface data-[selected=true]:text-foreground flex cursor-default items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none select-none"
                  >
                    <Icon className="text-subtle size-4" />
                    {page.label}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Separator className="bg-border my-1 h-px" />

            <Command.Group
              heading="Actions"
              className="text-subtle [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase"
            >
              <Command.Item
                value="New todo"
                onSelect={() => run(() => openTodoDialog())}
                className="text-muted data-[selected=true]:bg-surface data-[selected=true]:text-foreground flex cursor-default items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none select-none"
              >
                <Plus className="text-subtle size-4" />
                New todo
              </Command.Item>
              <Command.Item
                value="Refresh data"
                onSelect={() =>
                  run(() => {
                    void queryClient.invalidateQueries();
                  })
                }
                className="text-muted data-[selected=true]:bg-surface data-[selected=true]:text-foreground flex cursor-default items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none select-none"
              >
                <RefreshCw className="text-subtle size-4" />
                Refresh data
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
