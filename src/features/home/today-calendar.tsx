"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { isToday, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClock } from "@/hooks/use-clock";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCENT = "var(--accent-calendar)";

const eventDotClass: Record<string, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-subtle",
};

export function TodayCalendar() {
  const { data, isLoading } = useDashboardSnapshot();
  const now = useClock(30_000);

  const events = (data?.sources.calendar.data.events ?? [])
    .filter((event) => isToday(parseISO(event.start)))
    .slice(0, 6);

  return (
    <Card accent={ACCENT}>
      <CardHeader className="relative">
        <CardTitle>
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          Today&apos;s schedule
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar">
            Open calendar
            <ArrowUpRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="relative pt-0">
        {isLoading ? (
          <div className="space-y-2 py-1">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-subtle px-1 py-4 text-center text-xs">
            No events scheduled today.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {events.map((event) => {
              const start = parseISO(event.start);
              const end = parseISO(event.end);
              const current =
                now !== null && start <= now && end > now && !event.allDay;
              const dotClass =
                eventDotClass[event.color ?? "muted"] ?? eventDotClass.muted;

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-1 py-1.5 transition-colors",
                    current && "bg-info/8",
                  )}
                >
                  <span className="metrics text-subtle w-10 shrink-0 text-xs">
                    {event.allDay ? "all-day" : formatTime(event.start)}
                  </span>
                  <span className={cn("size-1.5 shrink-0 rounded-full", dotClass)} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px]",
                        current && "font-medium",
                      )}
                    >
                      {event.title}
                    </span>
                    {event.location ? (
                      <span className="text-subtle block truncate text-[11px]">
                        {event.location}
                      </span>
                    ) : null}
                  </span>
                  {current ? (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                      style={{
                        color: "var(--info)",
                        background: "color-mix(in oklab, var(--info) 12%, transparent)",
                      }}
                    >
                      now
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}