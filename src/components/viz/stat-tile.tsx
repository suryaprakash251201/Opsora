import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/viz/sparkline";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: LucideIcon;
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
        "group relative overflow-hidden rounded-[10px] border p-3.5 transition-all",
        className,
      )}
      style={
        {
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--panel) 92%, var(--surface) 8%) 0%, var(--panel) 100%)",
          borderColor: "var(--border)",
        } as React.CSSProperties
      }
    >
      {/* Accent gradient halo */}
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-40"
          style={{ background: accent }}
        />
      ) : null}

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-1.5 text-xs">
          {Icon ? (
            <Icon
              className="size-3.5"
              style={accent ? { color: accent } : { color: "var(--subtle)" }}
            />
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

      <div className="metrics relative flex items-baseline gap-1 text-xl leading-none font-semibold tracking-tight">
        {value}
        {unit ? (
          <span className="text-subtle text-xs font-normal">{unit}</span>
        ) : null}
      </div>

      {spark && spark.length > 1 ? (
        <Sparkline
          data={spark}
          height={24}
          className={cn(
            "relative h-6 w-full",
            accent ? "" : "text-subtle",
            sparkClassName,
          )}
          stroke={accent ?? "currentColor"}
        />
      ) : null}

      {footer ? <div className="text-subtle text-xs">{footer}</div> : null}
    </div>
  );
}
