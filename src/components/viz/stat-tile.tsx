import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { AnyIcon } from "@/components/viz/section";
import { Sparkline } from "@/components/viz/sparkline";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: AnyIcon;
  delta?: number;
  deltaSuffix?: string;
  spark?: number[];
  sparkClassName?: string;
  footer?: ReactNode;
  /** Accent variable (e.g. "var(--accent-docker)") — used for icon + spark */
  accent?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  unit,
  icon: Icon,
  delta,
  deltaSuffix = "%",
  spark,
  sparkClassName,
  footer,
  accent,
  className,
}: StatTileProps) {
  const negative = delta !== undefined && delta < 0;
  const DeltaIcon = negative ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className={cn(
        "kpi-card group/kpi relative overflow-hidden rounded-xl p-4 transition-all duration-200",
        className,
      )}
      style={
        {
          borderColor: accent
            ? `color-mix(in oklab, ${accent} 25%, var(--border))`
            : "color-mix(in oklab, var(--border) 75%, transparent)",
        } as React.CSSProperties
      }
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] opacity-75 transition-opacity group-hover/kpi:opacity-100"
          style={{
            background: accent,
            boxShadow: `0 1px 6px ${accent}`,
          }}
        />
      ) : null}

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-2 text-xs font-medium">
          {Icon ? (
            <span
              className="flex size-6 items-center justify-center rounded-lg border transition-transform duration-200 group-hover/kpi:scale-105"
              style={{
                background: accent
                  ? `color-mix(in oklab, ${accent} 14%, transparent)`
                  : "color-mix(in oklab, var(--surface) 80%, transparent)",
                borderColor: accent
                  ? `color-mix(in oklab, ${accent} 28%, transparent)`
                  : "var(--border)",
                color: accent ?? "var(--muted)",
                boxShadow: accent
                  ? `inset 0 0 0 1px color-mix(in oklab, ${accent} 15%, transparent)`
                  : undefined,
              }}
            >
              <Icon className="size-3.5" strokeWidth={2.2} />
            </span>
          ) : null}
          {label}
        </span>
        {delta !== undefined ? (
          <span
            className={cn(
              "metrics inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
              negative
                ? "border-success/25 bg-success/10 text-success"
                : "border-warning/25 bg-warning/10 text-warning",
            )}
          >
            <DeltaIcon className="size-3" />
            {Math.abs(delta).toFixed(1)}
            {deltaSuffix}
          </span>
        ) : null}
      </div>

      <div className="metrics relative mt-2 flex items-baseline gap-1.5 text-[24px] leading-none font-bold tracking-tight text-foreground">
        {value}
        {unit ? (
          <span className="text-muted text-xs font-normal">{unit}</span>
        ) : null}
      </div>

      {spark && spark.length > 1 ? (
        <Sparkline
          data={spark}
          height={28}
          className={cn(
            "relative mt-2.5 h-7 w-full",
            accent ? "" : "text-subtle",
            sparkClassName,
          )}
          stroke={accent ?? "currentColor"}
        />
      ) : null}

      {footer ? (
        <div className="text-subtle mt-2 truncate text-[11px] font-medium">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
