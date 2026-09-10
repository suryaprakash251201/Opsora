"use client";

import { Menu, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/viz/status-dot";
import { useAttention } from "@/hooks/use-attention";
import { useClock } from "@/hooks/use-clock";
import { formatClock, formatLongDate } from "@/lib/format";
import { useUiStore } from "@/stores/ui-store";

function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Topbar() {
  const now = useClock();
  const { health, summary, isLoading } = useAttention();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  const hour = now?.getHours() ?? 12;
  const status =
    health === "critical"
      ? { dot: "critical" as const, text: `${summary.critical} critical` }
      : health === "warning"
        ? {
            dot: "warning" as const,
            text: `${summary.needsAttention} need attention`,
          }
        : { dot: "healthy" as const, text: "System healthy" };

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
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
              {greetingFor(hour)}, Surya
            </p>
            <p className="text-subtle truncate text-xs">
              {now ? `${formatClock(now)} · ${formatLongDate(now)}` : "\u00a0"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted border-border bg-panel hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:flex">
            <Sun className="text-warning size-3.5" />
            <span className="metrics">32°C</span>
          </span>

          <span className="text-muted border-border bg-panel flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs">
            <StatusDot
              status={status.dot}
              pulse={!isLoading && health !== "healthy"}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Checking…" : status.text}
            </span>
          </span>

          <Button
            variant="secondary"
            size="sm"
            className="text-muted gap-2"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-3.5" />
            <span className="hidden md:inline">Search</span>
            <kbd className="border-border bg-surface hidden rounded border px-1 font-mono text-[10px] md:inline">
              ⌘K
            </kbd>
          </Button>
        </div>
      </div>
    </header>
  );
}
