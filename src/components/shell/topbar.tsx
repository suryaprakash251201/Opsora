"use client";

import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/viz/status-dot";
import { navItemForPath, accentVar } from "@/components/shell/nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useAttention } from "@/hooks/use-attention";
import { useClock } from "@/hooks/use-clock";
import { formatClock, formatLongDate } from "@/lib/format";
import { useRealtimeStore } from "@/stores/realtime-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Current page chip — live icon tinted with the page's module accent. */
function PageChip() {
  const pathname = usePathname();
  const item = navItemForPath(pathname);
  if (!item) return null;
  const Icon = item.icon;
  const accent = accentVar[item.accent];

  return (
    <span
      className="border-border/80 bg-panel/75 hidden items-center gap-2 rounded-full border py-1 pr-3 pl-1.5 shadow-xs transition-all hover:border-border-strong sm:flex"
      aria-current="page"
    >
      <span
        className="flex size-6 items-center justify-center rounded-full"
        style={{
          color: accent,
          background: `color-mix(in oklab, ${accent} 16%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 35%, transparent), 0 0 8px color-mix(in oklab, ${accent} 25%, transparent)`,
        }}
      >
        <Icon className="size-3.5" strokeWidth={2.2} />
      </span>
      <span className="text-xs font-semibold tracking-tight">{item.label}</span>
    </span>
  );
}

export function Topbar() {
  const now = useClock();
  const { health, summary, isLoading } = useAttention();
  const connected = useRealtimeStore((state) => state.connected);
  const { setSidebarOpen, setCommandOpen, openTodoDialog } = useUiStore();

  const hour = now?.getHours() ?? 12;
  const status =
    health === "critical"
      ? {
          dot: "critical" as const,
          text: `${summary.critical} critical`,
          color: "var(--danger)",
        }
      : health === "warning"
        ? {
            dot: "warning" as const,
            text: `${summary.needsAttention} need attention`,
            color: "var(--warning)",
          }
        : {
            dot: "healthy" as const,
            text: "All systems healthy",
            color: "var(--success)",
          };

  return (
    <header className="border-border/75 bg-background/70 surface-glass sticky top-0 z-30 border-b backdrop-blur-xl">
      {/* Animated health stripe — mirrors the system health. */}
      <div
        aria-hidden
        className="h-[2px] w-full transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${status.color} 25%, ${status.color} 75%, transparent 100%)`,
          boxShadow: `0 1px 6px ${status.color}`,
          opacity: isLoading ? 0.3 : 1,
        }}
      />

      <div className="flex h-14 items-center justify-between gap-3 px-3 lg:px-5">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              <span className="text-muted font-normal">{greetingFor(hour)},</span>{" "}
              <span className="text-foreground font-bold">Surya</span>
            </p>
            <p className="text-subtle metrics truncate text-[11px] font-medium">
              {now ? `${formatClock(now)} · ${formatLongDate(now)}` : " "}
            </p>
          </div>

          <span aria-hidden className="bg-border/80 hidden h-6 w-px sm:block" />

          <PageChip />
        </div>

        {/* CENTER */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className={cn(
            "border-border/80 bg-panel/70 text-muted hover:border-border-strong hover:bg-surface-hover hover:text-foreground group mx-2 hidden h-9 max-w-md flex-1 items-center gap-2.5 rounded-xl border px-3 text-xs shadow-xs transition-all lg:flex",
          )}
          aria-label="Open command palette"
        >
          <Search className="text-subtle group-hover:text-foreground size-3.5 transition-colors" />
          <span className="flex-1 truncate text-left font-normal">
            Search pages, tasks, sources…
          </span>
          <kbd className="border-border/80 bg-surface/90 text-subtle group-hover:text-muted rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          {/* Quick Task creation button */}
          <Button
            size="sm"
            onClick={() => openTodoDialog(undefined, "today")}
            className="hidden sm:inline-flex h-8 gap-1.5 px-3 text-xs font-semibold shadow-sm"
            title="New task (N)"
          >
            <Plus className="size-3.5" />
            <span>New Task</span>
            <kbd className="opacity-75 text-[10px] font-mono ml-0.5">N</kbd>
          </Button>

          {connected ? (
            <span
              className="border-success/30 bg-success/10 text-success hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase md:flex"
              title="Realtime SSE stream active"
            >
              <StatusDot status="healthy" pulse />
              Live
            </span>
          ) : null}

          <Link
            href="/alerts"
            className="text-muted border-border/80 bg-panel/75 hover:bg-surface hover:text-foreground flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors shadow-xs"
            title="View system alerts"
          >
            <StatusDot
              status={status.dot}
              pulse={!isLoading && health !== "healthy"}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Checking…" : status.text}
            </span>
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
          >
            <Search />
          </Button>

          <ThemeToggle className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  );
}
