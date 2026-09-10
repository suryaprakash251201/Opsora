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
  className,
}: StatTileProps) {
  const negative = delta !== undefined && delta < 0;
  const DeltaIcon = negative ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className={cn(
        "border-border bg-panel rounded-card flex flex-col gap-2 border p-3.5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-1.5 text-xs">
          {Icon ? <Icon className="text-subtle size-3.5" /> : null}
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

      <div className="metrics flex items-baseline gap-1 text-xl leading-none font-semibold tracking-tight">
        {value}
        {unit ? (
          <span className="text-subtle text-xs font-normal">{unit}</span>
        ) : null}
      </div>

      {spark && spark.length > 1 ? (
        <Sparkline
          data={spark}
          height={24}
          className={cn("text-subtle h-6 w-full", sparkClassName)}
        />
      ) : null}

      {footer ? <div className="text-subtle text-xs">{footer}</div> : null}
    </div>
  );
}
