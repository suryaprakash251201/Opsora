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
        "relative mb-2 flex flex-wrap items-end justify-between gap-3 overflow-hidden sm:mb-3",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 left-0 h-32 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: accent }}
      />
      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        <span
          aria-hidden
          className="mb-1 inline-block h-0.5 w-8 rounded-full"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        />
        <h1 className="text-[20px] leading-tight font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-muted text-[13px] leading-snug">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="relative flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
