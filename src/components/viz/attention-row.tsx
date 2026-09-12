import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { severityMeta } from "@/components/viz/severity";
import type { AttentionItem } from "@/lib/attention/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AttentionRowProps {
  item: AttentionItem;
  showTime?: boolean;
  className?: string;
}

export function AttentionRow({
  item,
  showTime = true,
  className,
}: AttentionRowProps) {
  const meta = severityMeta[item.severity];
  const Icon = meta.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-start gap-3.5 overflow-hidden rounded-xl border border-transparent px-3.5 py-3 transition-all duration-200",
        "hover:border-border/80 hover:bg-surface/70 hover:shadow-xs",
        className,
      )}
    >
      {/* Left severity indicator line */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 left-0 w-1 rounded-r-full transition-opacity duration-200",
          meta.dot,
          item.severity === "critical" || item.severity === "warning"
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
      />

      <span
        className={cn(
          "relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-transform duration-200 group-hover:scale-105",
          meta.bg,
          meta.border,
          meta.text,
        )}
        style={{
          boxShadow: `0 0 0 1px color-mix(in oklab, currentColor 18%, transparent) inset`,
        }}
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-foreground tracking-tight">
            {item.title}
          </span>
          {item.meta ? (
            <span
              className={cn(
                "metrics shrink-0 rounded-full px-1.5 py-0.2 text-[11px] font-semibold tracking-wide",
                meta.bg,
                meta.text,
              )}
            >
              {item.meta}
            </span>
          ) : null}
        </span>

        {item.detail ? (
          <span className="text-muted mt-0.5 line-clamp-2 block text-xs leading-relaxed font-normal">
            {item.detail}
          </span>
        ) : null}

        <span className="text-subtle mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-medium">
          {item.context ? (
            <span className="rounded-md border border-border/60 bg-surface/50 px-1.5 py-0.5 font-mono text-[10px]">
              {item.context}
            </span>
          ) : null}
          {showTime ? (
            <span className="flex items-center gap-1 text-subtle">
              <Clock className="size-3 text-subtle" />
              <span>{timeAgo(item.createdAt)}</span>
            </span>
          ) : null}
        </span>
      </span>

      <span className="flex size-7 items-center justify-center rounded-lg text-subtle transition-all duration-200 group-hover:bg-surface group-hover:text-foreground group-hover:translate-x-0.5">
        <ChevronRight className="size-4" />
      </span>
    </Link>
  );
}
