import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex items-end justify-between gap-3", className)}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="flex items-center gap-2 text-[13px] font-medium tracking-tight">
          {Icon ? <Icon className="text-subtle size-3.5" /> : null}
          {title}
        </h2>
        {description ? (
          <p className="text-subtle text-xs">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border/70 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? <Icon className="text-subtle size-5" /> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-subtle max-w-xs text-xs">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "The source did not respond. It will retry automatically.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "border-danger/20 bg-danger/5 flex flex-col items-center gap-1.5 rounded-lg border px-6 py-8 text-center",
        className,
      )}
    >
      <p className="text-danger text-sm font-medium">{title}</p>
      <p className="text-subtle text-xs">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-info mt-1 text-xs underline-offset-4 hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
