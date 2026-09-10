import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
        "group hover:bg-surface/70 relative flex items-start gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-all",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100",
          meta.dot,
        )}
      />
      <span
        className={cn(
          "relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border shadow-sm",
          meta.bg,
          meta.border,
          meta.text,
        )}
        style={{
          boxShadow: `0 0 0 1px color-mix(in oklab, currentColor 18%, transparent) inset`,
        }}
      >
        <Icon className="size-3.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium">
            {item.title}
          </span>
          {item.meta ? (
            <span
              className={cn("metrics shrink-0 text-xs font-medium", meta.text)}
            >
              {item.meta}
            </span>
          ) : null}
        </span>
        {item.detail ? (
          <span className="text-muted mt-0.5 line-clamp-2 block text-xs">
            {item.detail}
          </span>
        ) : null}
        <span className="text-subtle mt-1 flex items-center gap-2 text-[11px]">
          {item.context ? <span>{item.context}</span> : null}
          {item.context && showTime ? (
            <span className="bg-border-strong size-0.5 rounded-full" />
          ) : null}
          {showTime ? <span>{timeAgo(item.createdAt)}</span> : null}
        </span>
      </span>

      <ChevronRight
        className="text-subtle group-hover:text-foreground mt-1 size-3.5 shrink-0 transition-all group-hover:translate-x-0.5"
      />
    </Link>
  );
}
