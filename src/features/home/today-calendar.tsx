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
import { Badge } from "@/components/ui/badge";
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
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full"
            style={{
              background: ACCENT,
              boxShadow: `0 0 8px ${ACCENT}`,
            }}
          />
          Today&apos;s Agenda
          {events.length > 0 ? (
            <Badge variant="default" className="text-[11px] font-semibold px-2">
              {events.length} event{events.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <Link href="/calendar">
            Full agenda
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="relative pt-0">
        {isLoading ? (
          <div className="space-y-2 py-1">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-4 text-center">
            <p className="text-muted text-xs font-medium">No events scheduled today</p>
            <p className="text-subtle mt-0.5 text-[11px]">Check the calendar for upcoming meetings and reminders.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
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
                    "group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all duration-200",
                    current
                      ? "border-info/30 bg-info/8 shadow-2xs"
                      : "hover:border-border/70 hover:bg-surface/60",
                  )}
                >
                  <span className="metrics text-subtle rounded-md border border-border/60 bg-surface/50 px-1.5 py-0.5 text-[11px] font-semibold tracking-tight">
                    {event.allDay ? "all-day" : formatTime(event.start)}
                  </span>
                  <span className={cn("size-2 shrink-0 rounded-full", dotClass)} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px] font-medium text-foreground",
                        current && "font-semibold text-info",
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
                      className="border-info/30 bg-info/15 text-info shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                    >
                      Now
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