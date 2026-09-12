"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useAttention } from "@/hooks/use-attention";
import { useClock } from "@/hooks/use-clock";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";
import { formatLongDate } from "@/lib/format";

const emptySubscribe = () => () => {};

/**
 * Detects whether we're past hydration. Used to avoid SSR/client mismatches
 * for time-based content (e.g. greeting strings).
 */
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Flat editorial header for the home view — a single solid panel with a
 * sentence-case date line, a two-weight greeting headline, and a live
 * status line. Deliberately no ambient animation (no mesh, orbs, glass, or
 * gradient text) so first paint is cheap and the headline stays legible in
 * every theme.
 */
export function Hero() {
  const now = useClock(60_000);
  const { summary, isLoading: attentionLoading } = useAttention();
  const { data } = useDashboardSnapshot();

  // Avoid SSR/client mismatch for the time-based greeting / date label.
  const mounted = useIsMounted();

  const hour = now?.getHours() ?? 12;
  const greeting = greetingFor(hour);
  const dateLabel = mounted && now ? formatLongDate(now) : "";

  const health = useMemo(() => {
    if (attentionLoading) return { label: "Checking…", tone: "muted" as const };
    if (summary.critical > 0)
      return {
        label: `${summary.critical} critical · ${summary.warning} warning`,
        tone: "danger" as const,
      };
    if (summary.needsAttention > 0)
      return {
        label: `${summary.needsAttention} need attention`,
        tone: "warning" as const,
      };
    return { label: "All systems healthy", tone: "success" as const };
  }, [attentionLoading, summary]);

  // Collect live source statuses so we can surface the overall pulse.
  const liveCount = data
    ? Object.values(data.sources).filter((s) => s.status === "ok").length
    : 0;
  const totalSources = data ? Object.values(data.sources).length : 0;

  const toneColor =
    health.tone === "danger"
      ? "var(--danger)"
      : health.tone === "warning"
        ? "var(--warning)"
        : health.tone === "success"
          ? "var(--success)"
          : "var(--muted)";

  return (
    <section
      aria-label="Welcome"
      className="card-elevated relative overflow-hidden rounded-2xl border p-5 sm:p-6 lg:p-7 shadow-sm"
      style={{
        borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
      }}
    >
      {/* Subtle brand ambient glow in the top-right corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full opacity-35 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--brand) 0%, var(--brand-2) 60%, transparent 80%)",
        }}
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: toneColor }}
            />
            <span className="metrics tracking-normal">{dateLabel || "Today"}</span>
            <span className="text-subtle">·</span>
            <span className="text-subtle">Command Center v0.6</span>
          </div>

          <h1 className="text-balance text-[28px] leading-tight tracking-tight sm:text-[34px]">
            <span className="text-muted font-normal">{greeting},</span>{" "}
            <span className="text-foreground font-bold text-gradient-brand">Surya</span>
          </h1>

          <p className="text-muted max-w-xl text-[13.5px] leading-relaxed font-normal">
            Your home lab, developer workflows, and personal schedule — live, ranked, and unified in one place.
          </p>
        </div>

        {/* Live status telemetry block */}
        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-end">
          <div
            className="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-2xs backdrop-blur-md"
            style={{
              borderColor: `color-mix(in oklab, ${toneColor} 30%, var(--border))`,
              background: `color-mix(in oklab, ${toneColor} 8%, var(--panel))`,
            }}
          >
            <span
              aria-hidden
              className="relative flex size-2.5 items-center justify-center"
            >
              <span
                className="absolute size-full animate-ping rounded-full opacity-70"
                style={{ background: toneColor }}
              />
              <span
                className="size-2 rounded-full ring-2 ring-[var(--panel)]"
                style={{ background: toneColor }}
              />
            </span>
            <span className="font-semibold tracking-tight" style={{ color: toneColor }}>
              {health.label}
            </span>
          </div>

          <p className="text-subtle metrics text-xs sm:text-right font-medium">
            {totalSources > 0 ? (
              <span>
                <span className="text-foreground font-semibold">{liveCount}</span> of{" "}
                <span className="text-foreground font-semibold">{totalSources}</span> sources streaming live
              </span>
            ) : (
              "Connecting to live telemetry…"
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
