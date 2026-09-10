import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Optional accent (CSS color) for the underline bar and gradient halo. */
  accent?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  accent = "var(--brand)",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative mb-4 flex flex-wrap items-end justify-between gap-3 overflow-hidden",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 left-0 h-32 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: accent }}
      />
      <div className="relative flex flex-col gap-0.5">
        <span
          aria-hidden
          className="bg-foreground/70 mb-1 inline-block h-0.5 w-6 rounded-full"
          style={{ background: accent }}
        />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-subtle text-xs">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="relative flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
