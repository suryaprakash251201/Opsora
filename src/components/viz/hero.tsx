"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import { useAttention } from "@/hooks/use-attention";
import { useClock } from "@/hooks/use-clock";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";
import { formatLongDate } from "@/lib/format";

interface OrbProps {
  /** Distance from the center (px). */
  radius: number;
  /** Size of the orb (px). */
  size: number;
  /** Brand-ish color (CSS). */
  color: string;
  /** Animation duration in seconds. */
  duration: number;
  /** Animation delay in seconds (negative = ahead). */
  delay?: number;
  /** Reverse direction. */
  reverse?: boolean;
}

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

/**
 * Single floating "planet" that circles the hero. Implemented with CSS
 * variables + transforms to avoid re-renders.
 */
function Orb({
  radius,
  size,
  color,
  duration,
  delay = 0,
  reverse = false,
}: OrbProps) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={
        {
          width: size,
          height: size,
          top: "50%",
          left: "50%",
          marginTop: -size / 2,
          marginLeft: -size / 2,
          background: `radial-gradient(circle at 30% 30%, ${color}, color-mix(in oklab, ${color} 0%, transparent) 70%)`,
          boxShadow: `0 0 ${size}px ${color}, 0 0 ${size * 2}px color-mix(in oklab, ${color} 60%, transparent)`,
          opacity: 0.85,
          filter: "blur(0.4px)",
          ["--orbit-r" as string]: `${radius}px`,
          animation: `${reverse ? "orbit-reverse" : "orbit"} ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
        } as React.CSSProperties
      }
    />
  );
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Animated hero shown at the top of the home view — a glassy card with a
 * personalized greeting, a quick system-health summary, and an animated
 * mesh-gradient + orbiting-orbs background.
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

  return (
    <section
      aria-label="Welcome"
      className="reveal gradient-border gradient-border-strong card-glass shine-on-hover relative isolate overflow-hidden rounded-2xl"
      data-delay="1"
    >
      {/* Animated mesh gradient backdrop */}
      <div
        aria-hidden
        className="bg-hero-mesh pointer-events-none absolute inset-0 -z-10 animate-[mesh_16s_ease-in-out_infinite]"
      />
      {/* Faint grid overlay */}
      <div
        aria-hidden
        className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(80%_60%_at_50%_30%,black,transparent)]"
      />

      {/* Orbiting accent orbs (decorative) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block"
      >
        <Orb radius={220} size={140} color="var(--brand)" duration={22} />
        <Orb
          radius={300}
          size={110}
          color="var(--brand-2)"
          duration={28}
          delay={-6}
          reverse
        />
        <Orb
          radius={180}
          size={80}
          color="var(--accent-home)"
          duration={18}
          delay={-3}
        />
      </div>

      {/* Subtle vignette to keep text readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, transparent 40%, color-mix(in oklab, var(--background) 65%, transparent) 100%)",
        }}
      />

      <div className="relative flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-8 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex size-6 items-center justify-center rounded-full"
              style={{
                background:
                  "color-mix(in oklab, var(--brand) 18%, transparent)",
                color: "var(--brand)",
                boxShadow:
                  "inset 0 0 0 1px color-mix(in oklab, var(--brand) 35%, transparent)",
            }}
            >
              <Sparkles className="size-3" strokeWidth={2.4} />
            </span>
            <span className="text-muted text-xs font-medium tracking-wide uppercase">
              {dateLabel || "\u00a0"}
            </span>
          </div>

          {/* Greeting */}
          <h1 className="text-balance text-[28px] leading-[1.05] font-semibold tracking-tight sm:text-[34px] lg:text-[40px]">
            <span className="text-muted">{greeting},</span>{" "}
            <span className="text-gradient-brand">Surya</span>
            <span className="text-muted">.</span>
          </h1>

          <p className="text-muted max-w-xl text-[14px] leading-relaxed">
            Everything your home lab, repos, and schedule are doing — in one
            calm, glanceable view.
          </p>
        </div>

        {/* Health + live-source chips */}
        <div className="flex shrink-0 flex-col items-stretch gap-2 lg:items-end">
          <span
            className="inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-medium tracking-tight lg:self-end"
            style={{
              borderColor:
                health.tone === "danger"
                  ? "color-mix(in oklab, var(--danger) 35%, transparent)"
                  : health.tone === "warning"
                    ? "color-mix(in oklab, var(--warning) 35%, transparent)"
                    : health.tone === "success"
                      ? "color-mix(in oklab, var(--success) 35%, transparent)"
                      : "var(--border)",
              background:
                health.tone === "danger"
                  ? "color-mix(in oklab, var(--danger) 10%, transparent)"
                  : health.tone === "warning"
                    ? "color-mix(in oklab, var(--warning) 10%, transparent)"
                    : health.tone === "success"
                      ? "color-mix(in oklab, var(--success) 10%, transparent)"
                      : "color-mix(in oklab, var(--surface) 60%, transparent)",
              color:
                health.tone === "danger"
                  ? "var(--danger)"
                  : health.tone === "warning"
                    ? "var(--warning)"
                    : health.tone === "success"
                      ? "var(--success)"
                      : "var(--muted)",
            }}
          >
            <span
              aria-hidden
              className="relative inline-flex size-2 rounded-full"
              style={{
                background: "currentColor",
                boxShadow: `0 0 10px currentColor`,
              }}
            >
              <span
                aria-hidden
                className="absolute inset-0 animate-[ping_2.4s_ease-in-out_infinite] rounded-full opacity-70"
                style={{ background: "currentColor" }}
              />
            </span>
            {health.label}
          </span>

          <span className="text-subtle text-xs">
            {totalSources > 0
              ? `${liveCount} of ${totalSources} live sources connected`
              : "Connecting to live sources…"}
          </span>
        </div>
      </div>
    </section>
  );
}