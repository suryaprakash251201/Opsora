import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";
import { toneForValue, type Tone } from "@/components/viz/ring";

const toneBar: Record<Tone, string> = {
  default: "bg-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  brand: "bg-[var(--brand)]",
};

interface MeterProps {
  label: string;
  value: number;
  detail?: string;
  tone?: Tone;
  thresholds?: [number, number];
  className?: string;
}

export function Meter({
  label,
  value,
  detail,
  tone,
  thresholds,
  className,
}: MeterProps) {
  const resolvedTone = tone ?? toneForValue(value, thresholds);
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted text-xs">{label}</span>
        <span className="metrics text-xs">
          {detail ?? formatPercent(clamped)}
        </span>
      </div>
      <div className="bg-surface h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            toneBar[resolvedTone],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
