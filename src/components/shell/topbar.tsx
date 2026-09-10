"use client";

import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/viz/status-dot";
import { useAttention } from "@/hooks/use-attention";
import { useClock } from "@/hooks/use-clock";
import { formatClock, formatLongDate } from "@/lib/format";
import { useRealtimeStore } from "@/stores/realtime-store";
import { useUiStore } from "@/stores/ui-store";
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
            text: "System healthy",
            color: "var(--success)",
          };

  return (
    <header className="border-border bg-background/70 surface-glass sticky top-0 z-30 border-b">
      {/* Animated health stripe — mirrors the system health. */}
      <div
        aria-hidden
        className="h-0.5 w-full transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${status.color} 30%, ${status.color} 70%, transparent 100%)`,
          opacity: isLoading ? 0.3 : 1,
        }}
      />

      <div
        className="flex h-14 items-center justify-between gap-3 px-3 lg:px-5"
        style={{ minHeight: "var(--header-h)" }}
      >
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-2">
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
              <span className="text-muted">{greetingFor(hour)},</span>{" "}
              <span className="text-gradient-brand">Surya</span>
            </p>
            <p className="text-subtle metrics truncate text-[11px]">
              {now ? `${formatClock(now)} · ${formatLongDate(now)}` : "\u00a0"}
            </p>
          </div>

          <span aria-hidden className="bg-border hidden h-6 w-px sm:block" />
          <span className="text-subtle hidden items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase sm:flex">
            <span
              className="size-1.5 rounded-full"
              style={{ background: sidebarCollapsed ? "var(--brand-2)" : "var(--brand)" }}
            />
            {sidebarCollapsed ? "Compact" : "Full layout"}
          </span>
        </div>

        {/* CENTER */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className={cn(
            "border-border bg-panel/60 text-muted hover:bg-surface-hover hover:text-foreground group hidden h-9 max-w-md flex-1 items-center gap-2.5 rounded-lg border px-3 text-xs transition-all lg:flex",
            "mx-2",
          )}
          aria-label="Open command palette"
        >
          <Search className="text-subtle group-hover:text-muted size-3.5" />
          <span className="flex-1 truncate text-left">
            Search pages, tasks, sources…
          </span>
          <kbd className="border-border bg-surface/80 rounded border px-1.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <span className="text-muted border-border bg-panel/60 hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs md:flex">
              <StatusDot status="healthy" pulse />
              live
            </span>
          ) : null}

          <span className="text-muted border-border bg-panel/60 flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs">
            <StatusDot
              status={status.dot}
              pulse={!isLoading && health !== "healthy"}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Checking…" : status.text}
            </span>
          </span>

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
