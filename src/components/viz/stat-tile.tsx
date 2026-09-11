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
        "group card-glass gradient-border relative overflow-hidden rounded-[10px] p-4 transition-all duration-300 ease-out",
        className,
      )}
      style={
        {
          borderColor:
            "color-mix(in oklab, var(--border) 70%, transparent)",
        } as React.CSSProperties
      }
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-55"
          style={{ background: accent }}
        />
      ) : null}

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-2 text-xs">
          {Icon ? (
            <span
              className="flex size-5 items-center justify-center rounded-md"
              style={{
                background: accent
                  ? `color-mix(in oklab, ${accent} 14%, transparent)`
                  : "color-mix(in oklab, var(--surface) 80%, transparent)",
                color: accent ?? "var(--muted)",
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
              "metrics inline-flex items-center gap-0.5 text-xs",
              negative ? "text-success" : "text-warning",
            )}
          >
            <DeltaIcon className="size-3" />
            {Math.abs(delta).toFixed(1)}
            {deltaSuffix}
          </span>
        ) : null}
      </div>

      <div className="metrics relative mt-1 flex items-baseline gap-1 text-[22px] leading-none font-semibold tracking-tight">
        {value}
        {unit ? (
          <span className="text-subtle text-xs font-normal">{unit}</span>
        ) : null}
      </div>

      {spark && spark.length > 1 ? (
        <Sparkline
          data={spark}
          height={28}
          className={cn(
            "relative mt-2 h-7 w-full",
            accent ? "" : "text-subtle",
            sparkClassName,
          )}
          stroke={accent ?? "currentColor"}
        />
      ) : null}

      {footer ? <div className="text-subtle mt-1 text-xs">{footer}</div> : null}
    </div>
  );
}
