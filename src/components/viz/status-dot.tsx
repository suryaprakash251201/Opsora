import { cn } from "@/lib/utils";

export type DotStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "info"
  | "unknown";

const statusStyles: Record<DotStatus, { dot: string; label: string }> = {
  healthy: { dot: "bg-success", label: "Healthy" },
  warning: { dot: "bg-warning", label: "Degraded" },
  critical: { dot: "bg-danger", label: "Critical" },
  info: { dot: "bg-info", label: "Info" },
  unknown: { dot: "bg-subtle", label: "Unknown" },
};

interface StatusDotProps {
  status: DotStatus;
  pulse?: boolean;
  label?: string;
  className?: string;
}

export function StatusDot({
  status,
  pulse = false,
  label,
  className,
}: StatusDotProps) {
  const style = statusStyles[status];

  return (
    <span
      className={cn("relative inline-flex size-2 shrink-0", className)}
      role="img"
      aria-label={label ?? style.label}
    >
      {pulse && status !== "unknown" ? (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-40",
            style.dot,
          )}
        />
      ) : null}
      <span
        className={cn("relative inline-flex size-2 rounded-full", style.dot)}
      />
    </span>
  );
}

export function StatusLabel({
  status,
  text,
  pulse,
  className,
}: {
  status: DotStatus;
  text?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-muted inline-flex items-center gap-1.5 text-xs",
        className,
      )}
    >
      <StatusDot status={status} pulse={pulse} />
      {text ?? statusStyles[status].label}
    </span>
  );
}
