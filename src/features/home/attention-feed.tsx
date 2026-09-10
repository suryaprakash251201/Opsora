"use client";

import Link from "next/link";
import { ArrowUpRight, CircleCheckBig } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AttentionRow } from "@/components/viz/attention-row";
import { EmptyState } from "@/components/viz/section";
import { useAttention } from "@/hooks/use-attention";

const ACCENT = "var(--accent-alerts)";

export function AttentionFeed({ limit = 6 }: { limit?: number }) {
  const { items, summary, isLoading } = useAttention();

  const needing = items.filter(
    (item) => item.severity === "critical" || item.severity === "warning",
  );
  const shown = (needing.length > 0
    ? needing
    : items.filter((item) => item.severity === "info")
  ).slice(0, limit);

  const healthy = !isLoading && needing.length === 0;
  const successes = items
    .filter((item) => item.severity === "success")
    .slice(0, 2);

  return (
    <Card className="relative overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full opacity-25 blur-3xl"
        style={{ background: ACCENT }}
      />
      <CardHeader className="relative">
        <CardTitle>
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          Attention required
          {!isLoading && summary.needsAttention > 0 ? (
            <Badge variant={summary.critical > 0 ? "danger" : "warning"}>
              {summary.needsAttention}
            </Badge>
          ) : null}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/alerts">
            View all
            <ArrowUpRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="relative pt-0">
        {isLoading ? (
          <div className="flex flex-col gap-1 py-1">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="size-7 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {shown.map((item) => (
              <AttentionRow key={item.id} item={item} />
            ))}
          </div>
        ) : healthy ? (
          <div className="space-y-2">
            <EmptyState
              icon={CircleCheckBig}
              title="Everything looks healthy"
              description="No critical alerts or warnings across your systems right now."
              accent="var(--success)"
            />
            {successes.map((item) => (
              <AttentionRow key={item.id} item={item} showTime={false} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
