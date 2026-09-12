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
        "relative mb-4 flex flex-wrap items-center justify-between gap-4 border-b pb-4 sm:mb-5",
        className,
      )}
      style={{
        borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
      }}
    >
      <div className="relative flex min-w-0 flex-1 items-center gap-3.5">
        {Icon ? (
          <span
            aria-hidden
            className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:scale-105"
            style={{
              color: itemAccent,
              borderColor: `color-mix(in oklab, ${itemAccent} 35%, transparent)`,
              background: `linear-gradient(135deg, color-mix(in oklab, ${itemAccent} 16%, transparent) 0%, color-mix(in oklab, var(--panel) 90%, transparent) 100%)`,
              boxShadow: `0 2px 10px -2px color-mix(in oklab, ${itemAccent} 25%, transparent), inset 0 0 0 1px color-mix(in oklab, ${itemAccent} 20%, transparent)`,
            }}
          >
            <Icon className="size-5.5" strokeWidth={2} />
          </span>
        ) : (
          <span
            aria-hidden
            className="inline-block h-8 w-1.5 rounded-full"
            style={{
              background: itemAccent,
              boxShadow: `0 0 12px ${itemAccent}`,
            }}
          />
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-balance text-[22px] leading-tight font-bold tracking-tight text-foreground sm:text-[24px]">
            {title}
          </h1>
          {description ? (
            <p className="text-muted text-[13px] leading-snug font-normal">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="relative flex items-center gap-2.5 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}