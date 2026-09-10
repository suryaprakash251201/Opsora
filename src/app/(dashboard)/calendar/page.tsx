"use client";

import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { isToday, parseISO } from "date-fns";
import { PageHeader } from "@/components/viz/page-header";
import { ErrorState } from "@/components/viz/section";
import { SourceWarning } from "@/components/viz/source-warning";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClock } from "@/hooks/use-clock";
import { useSourceSnapshot } from "@/hooks/use-snapshot";
import { formatDayLabel, formatTime } from "@/lib/format";
import type { CalendarEvent } from "@/lib/mock/calendar";
import { cn } from "@/lib/utils";

const colorClasses: Record<CalendarEvent["color"], string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-subtle",
};

export default function CalendarPage() {
  const { data, isLoading, isError, refetch } = useSourceSnapshot(
    "calendar",
    300_000,
  );
  const now = useClock(30_000);

  const events = data?.data.events ?? [];
  const days = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const key = event.start.slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), event]);
  }

  const todayCount = events.filter((event) => isToday(parseISO(event.start)))
    .length;

  return (
    <>
      <PageHeader
        title="Calendar"
        description={
          isLoading
            ? "Next seven days"
            : `${todayCount} event${todayCount === 1 ? "" : "s"} today · ${events.length} in the next seven days`
        }
        actions={
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
            <CalendarDays className="size-3.5" />
            Work · Personal · Ops · Focus
          </Badge>
        }
      />

      <SourceWarning snapshot={data} className="mb-4" />

      {isError ? (
        <ErrorState
          title="Could not load the calendar"
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...days.entries()].map(([day, dayEvents]) => {
            const dayDate = parseISO(day);
            const isCurrentDay = now ? isToday(dayDate) : false;

            return (
              <section
                key={day}
                className={cn(
                  "border-border bg-panel rounded-card border",
                  isCurrentDay && "border-info/30",
                )}
              >
                <header className="border-border/60 flex items-center justify-between border-b px-4 py-2.5">
                  <h2 className="flex items-center gap-2 text-[13px] font-medium">
                    {formatDayLabel(day)}
                    {isCurrentDay ? (
                      <Badge variant="info">today</Badge>
                    ) : null}
                  </h2>
                  <span className="text-subtle text-xs">
                    {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                  </span>
                </header>

                <ul className="divide-border/40 divide-y">
                  {dayEvents.map((event) => {
                    const start = parseISO(event.start);
                    const end = parseISO(event.end);
                    const current =
                      now !== null && start <= now && end > now && !event.allDay;

                    return (
                      <li
                        key={event.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3",
                          current && "bg-info/5",
                        )}
                      >
                        <span className="metrics text-subtle w-24 shrink-0 text-xs">
                          {event.allDay
                            ? "All day"
                            : `${formatTime(event.start)}–${formatTime(event.end)}`}
                        </span>
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            colorClasses[event.color],
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13px]",
                              current && "font-medium",
                            )}
                          >
                            {event.title}
                          </p>
                          <p className="text-subtle mt-0.5 flex items-center gap-3 text-[11px]">
                            {event.location ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" />
                                {event.location}
                              </span>
                            ) : null}
                            {event.attendees ? (
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {event.attendees}
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {event.calendar}
                            </span>
                          </p>
                        </div>
                        {current ? (
                          <Badge variant="info">now</Badge>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
