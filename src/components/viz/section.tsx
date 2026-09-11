import type { ComponentType } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Any renderable icon — lucide or animated live icon. */
export type AnyIcon = ComponentType<{
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number | string;
}>;

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: AnyIcon;
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
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="flex flex-col gap-0.5">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
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
  icon?: AnyIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  accent?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  accent,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border/70 bg-panel/40 relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
      style={
        accent
          ? ({
              background:
                "color-mix(in oklab, currentColor 4%, var(--panel))",
              borderColor:
                "color-mix(in oklab, currentColor 22%, var(--border))",
              color: accent,
            } as React.CSSProperties)
          : undefined
      }
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: accent }}
        />
      ) : null}
      {Icon ? <Icon className="relative size-5" /> : null}
      <p className="text-foreground relative text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-subtle relative max-w-xs text-xs leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative mt-1">{action}</div> : null}
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
        "border-danger/25 bg-danger/5 text-danger flex flex-col items-center gap-1.5 rounded-lg border px-6 py-8 text-center",
        className,
      )}
    >
      <CircleAlert className="size-5" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-subtle text-xs">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-danger mt-1 inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
        >
          <RefreshCw className="size-3" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

/**
 * CTA used when a page is empty because the source isn't configured yet.
 * Explains the env variable(s) needed and points to Settings.
 */
export function EmptyConfigHint({
  title,
  description,
  env,
  icon: Icon,
  accent,
  docs,
}: {
  title: string;
  description: string;
  env: string[];
  icon?: AnyIcon;
  accent?: string;
  docs?: { label: string; href: string };
}) {
  return (
    <div
      className="border-border/70 bg-panel/40 relative overflow-hidden rounded-lg border p-6"
      style={{ borderColor: "var(--border)" }}
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full opacity-15 blur-3xl"
          style={{ background: accent }}
        />
      ) : null}

      <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: accent
              ? `color-mix(in oklab, ${accent} 16%, transparent)`
              : "var(--surface)",
            color: accent ?? "var(--muted)",
          }}
        >
          {Icon ? <Icon className="size-5" strokeWidth={1.8} /> : null}
        </span>

        <div className="flex-1">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <p className="text-muted mt-1 text-[13px] leading-relaxed">
            {description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {env.map((name) => (
              <code
                key={name}
                className="border-border/60 bg-background/40 text-foreground metrics rounded-md border px-2 py-1 text-[11px]"
              >
                {name}
              </code>
            ))}
            <Link
              href="/settings"
              className="text-info inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
            >
              Configure
              <ArrowRight className="size-3" />
            </Link>
            {docs ? (
              <a
                href={docs.href}
                target="_blank"
                rel="noreferrer"
                className="text-muted inline-flex items-center gap-1 text-xs hover:text-foreground"
              >
                {docs.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
