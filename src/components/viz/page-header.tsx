"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { navItemForPath, accentVar } from "@/components/shell/nav";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Optional accent (CSS color) for the icon chip and gradient halo. */
  accent?: string;
  className?: string;
}

/**
 * Section header with a live-icon chip tinted by the page's module accent.
 * The icon is resolved from the current route via the shell nav config, so
 * headers and navigation always agree on icon + color.
 */
export function PageHeader({
  title,
  description,
  actions,
  accent = "var(--brand)",
  className,
}: PageHeaderProps) {
  const pathname = usePathname();
  const item = navItemForPath(pathname);
  const itemAccent = item ? accentVar[item.accent] : accent;
  const Icon = item?.icon;

  return (
    <div
      className={cn(
        "relative mb-2 flex flex-wrap items-center justify-between gap-3 sm:mb-3",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 left-0 h-32 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: itemAccent }}
      />
      <div className="relative flex min-w-0 flex-1 items-center gap-3">
        {Icon ? (
          <span
            aria-hidden
            className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
            style={{
              color: itemAccent,
              borderColor: `color-mix(in oklab, ${itemAccent} 32%, transparent)`,
              background: `color-mix(in oklab, ${itemAccent} 12%, transparent)`,
              boxShadow: `0 4px 16px -6px color-mix(in oklab, ${itemAccent} 40%, transparent), inset 0 1px 0 0 color-mix(in oklab, ${itemAccent} 25%, transparent)`,
            }}
          >
            <Icon className="size-5" strokeWidth={1.9} />
          </span>
        ) : (
          <span
            aria-hidden
            className="inline-block h-8 w-1 rounded-full"
            style={{ background: itemAccent, boxShadow: `0 0 12px ${itemAccent}` }}
          />
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-balance text-[20px] leading-tight font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-muted text-[13px] leading-snug">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="relative flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}