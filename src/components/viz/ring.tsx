import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/format";

export type Tone =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand";

const toneStroke: Record<Tone, string> = {
  default: "stroke-foreground",
  info: "stroke-info",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
  brand: "stroke-[var(--brand)]",
};

export function toneForValue(
  value: number,
  thresholds: [number, number] = [75, 90],
): Tone {
  if (value >= thresholds[1]) return "danger";
  if (value >= thresholds[0]) return "warning";
  return "success";
}

interface RingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
  trackClassName?: string;
  /** Animate the dash on mount. */
  animate?: boolean;
}

export function Ring({
  value,
  size = 56,
  strokeWidth = 5,
  tone = "info",
  children,
  className,
  trackClassName,
  animate = true,
}: RingProps) {
  const clamped = clamp(value, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-border", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className={cn(
            toneStroke[tone],
            animate && "transition-[stroke-dasharray] duration-700 ease-out",
          )}
          style={{ filter: `drop-shadow(0 0 6px currentColor)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="metrics text-xs font-semibold">
            {Math.round(clamped)}%
          </span>
        )}
      </div>
    </div>
  );
}
