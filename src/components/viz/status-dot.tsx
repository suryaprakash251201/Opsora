import { cn } from "@/lib/utils";

export type DotStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "info"
  | "unknown";

const statusStyles: Record<
  DotStatus,
  { dot: string; glow: string; label: string }
> = {
  healthy: {
    dot: "bg-success",
    glow: "rgba(34, 197, 94, 0.4)",
    label: "Healthy",
  },
  warning: {
    dot: "bg-warning",
    glow: "rgba(245, 158, 11, 0.4)",
    label: "Degraded",
  },
  critical: {
    dot: "bg-danger",
    glow: "rgba(239, 68, 68, 0.4)",
    label: "Critical",
  },
  info: {
    dot: "bg-info",
    glow: "rgba(59, 130, 246, 0.4)",
    label: "Info",
  },
  unknown: {
    dot: "bg-subtle",
    glow: "rgba(111, 111, 122, 0.2)",
    label: "Unknown",
  },
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
      className={cn("relative inline-flex size-2.5 items-center justify-center shrink-0", className)}
      role="img"
      aria-label={label ?? style.label}
    >
      {pulse && status !== "unknown" ? (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-60",
            style.dot,
          )}
        />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full ring-2 ring-[var(--panel)]",
          style.dot,
        )}
        style={{
          boxShadow: `0 0 8px ${style.glow}`,
        }}
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
