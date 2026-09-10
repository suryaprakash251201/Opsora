"use client";

import { Menu, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/viz/status-dot";
import { useAttention } from "@/hooks/use-attention";
import { useClock } from "@/hooks/use-clock";
import { formatClock, formatLongDate } from "@/lib/format";
import { useRealtimeStore } from "@/stores/realtime-store";
import { useUiStore } from "@/stores/ui-store";
import { LayoutToggle } from "@/components/shell/layout-toggle";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { cn } from "@/lib/utils";

function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Topbar() {
  const now = useClock();
  const { health, summary, isLoading } = useAttention();
  const connected = useRealtimeStore((state) => state.connected);
  const { setSidebarOpen, setCommandOpen, sidebarCollapsed } = useUiStore();

  const hour = now?.getHours() ?? 12;
  const status =
    health === "critical"
      ? {
          dot: "critical" as const,
          text: `${summary.critical} critical`,
          barClass: "bg-danger",
        }
      : health === "warning"
        ? {
            dot: "warning" as const,
            text: `${summary.needsAttention} need attention`,
            barClass: "bg-warning",
          }
        : {
            dot: "healthy" as const,
            text: "System healthy",
            barClass: "bg-success",
          };

  return (
    <header
      className={cn(
        "border-border bg-background/70 surface-glass sticky top-0 z-30",
        // Push the floating sidebar's notch out so the header visibly spans
        // the full canvas in both collapsed and expanded layouts.
        "border-b",
      )}
    >
      {/* Animated health stripe — a thin colored band along the very top
          of the header that mirrors the system health. */}
      <div
        aria-hidden
        className={cn(
          "h-0.5 w-full transition-colors duration-500",
          status.barClass,
        )}
        style={{
          opacity: isLoading ? 0.4 : 1,
          background: `linear-gradient(90deg, transparent, var(--${health === "healthy" ? "success" : health === "warning" ? "warning" : "danger"}) 30%, var(--${health === "healthy" ? "success" : health === "warning" ? "warning" : "danger"}) 70%, transparent)`,
        }}
      />

      <div className="flex items-center justify-between gap-3 px-4 py-2 lg:px-6">
        {/* LEFT — greeting + brand stripe */}
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
            <p className="truncate text-sm font-medium tracking-tight">
              <span className="text-muted">{greetingFor(hour)},</span>{" "}
              <span className="text-gradient-brand">Surya</span>
            </p>
            <p className="text-subtle truncate text-xs">
              {now ? `${formatClock(now)} · ${formatLongDate(now)}` : "\u00a0"}
            </p>
          </div>

          {/* Hairline divider + density label */}
          <span
            aria-hidden
            className="bg-border hidden h-6 w-px sm:block"
          />
          <span
            className={cn(
              "text-subtle hidden items-center gap-1.5 text-[10px] tracking-widest uppercase sm:flex",
            )}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background: sidebarCollapsed ? "var(--brand-2)" : "var(--brand)",
              }}
            />
            {sidebarCollapsed ? "Compact" : "Full layout"}
          </span>
        </div>

        {/* CENTER — quick search (only on wide screens) */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className={cn(
            "border-border bg-panel text-muted hover:bg-surface-hover hover:text-foreground group hidden h-8 max-w-md flex-1 items-center gap-2 rounded-md border px-3 text-xs transition-all lg:flex",
            "mx-2",
          )}
          aria-label="Open command palette"
        >
          <Search className="text-subtle group-hover:text-muted size-3.5" />
          <span className="flex-1 truncate text-left">
            Search pages, tasks, sources…
          </span>
          <kbd className="border-border bg-surface rounded border px-1.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* RIGHT — pills + status + toggles */}
        <div className="flex items-center gap-2">
          <span className="text-muted border-border bg-panel hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:flex">
            <Sun className="text-warning size-3.5" />
            <span className="metrics">32°C</span>
          </span>

          {connected ? (
            <span className="text-muted border-border bg-panel hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs md:flex">
              <StatusDot status="healthy" pulse />
              live
            </span>
          ) : null}

          <span className="text-muted border-border bg-panel flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs">
            <StatusDot
              status={status.dot}
              pulse={!isLoading && health !== "healthy"}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Checking…" : status.text}
            </span>
          </span>

          {/* Mobile-only search trigger */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
          >
            <Search />
          </Button>

          {/* Dark / light theme switcher */}
          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Full layout expand/collapse control */}
          <LayoutToggle className="hidden lg:inline-flex" />
        </div>
      </div>
    </header>
  );
}
