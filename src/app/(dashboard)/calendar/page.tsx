"use client";

import { CalendarPlus, Clock, MapPin, Users } from "lucide-react";
import { LiveCalendar } from "@/components/icons/live";
import { isToday, parseISO } from "date-fns";
import { PageHeader } from "@/components/viz/page-header";
import { EmptyConfigHint, EmptyState, ErrorState } from "@/components/viz/section";
import { SourceWarning } from "@/components/viz/source-warning";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClock } from "@/hooks/use-clock";
import { REFETCH_INTERVALS, useSourceSnapshot } from "@/hooks/use-snapshot";
import { formatDayLabel, formatTime } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types/calendar";
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
    REFETCH_INTERVALS.calendar,
  );
  const now = useClock(30_000);

  const events = data?.data.events ?? [];
  const isUnconfigured = data?.mode === "empty" && events.length === 0;
  const days = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const key = event.start.slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), event]);
  }

  const todayCount = events.filter((event) => isToday(parseISO(event.start))).length;

  return (
    <>
      <PageHeader
        title="Calendar"
        accent="var(--accent-calendar)"
        description={
          isLoading
            ? "Next seven days"
            : isUnconfigured
              ? "Connect Google Calendar to see your events"
              : `${todayCount} event${todayCount === 1 ? "" : "s"} today · ${events.length} in the next seven days`
        }
        actions={
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
            <LiveCalendar className="size-3.5" />
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
      ) : isUnconfigured ? (
        <div className="flex flex-col gap-4">
          <EmptyConfigHint
            icon={CalendarPlus}
            accent="var(--accent-calendar)"
            title="Connect Google Calendar"
            description="Opsora reads your events through the official Google Calendar API. The agent script under scripts/google-oauth.mjs walks you through a one-time consent and prints the refresh token you need to drop into .env.local."
            env={[
              "GOOGLE_CLIENT_ID",
              "GOOGLE_CLIENT_SECRET",
              "GOOGLE_REFRESH_TOKEN",
            ]}
          />
          <EmptyState
            icon={LiveCalendar}
            title="No events to show"
            description="Today and the next seven days will appear here once Google Calendar is configured."
          />
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
                  "card-elevated relative overflow-hidden rounded-2xl border border-border/80 shadow-xs transition-all duration-200",
                  isCurrentDay && "border-[var(--accent-calendar)]/50 ring-1 ring-[var(--accent-calendar)]/25",
                )}
              >
                {isCurrentDay ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                    style={{
                      background: "var(--accent-calendar)",
                      boxShadow: "0 1px 8px var(--accent-calendar)",
                    }}
                  />
                ) : null}

                <header className="border-b border-border/70 bg-surface/30 flex items-center justify-between px-5 py-3">
                  <h2 className="flex items-center gap-2.5 text-[14px] font-bold text-foreground tracking-tight">
                    {formatDayLabel(day)}
                    {isCurrentDay ? (
                      <Badge variant="success" className="font-semibold uppercase text-[10px] tracking-wider px-2">
                        Today
                      </Badge>
                    ) : null}
                  </h2>
                  <span className="metrics text-subtle text-xs font-medium">
                    {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                  </span>
                </header>

                <ul className="divide-y divide-border/50">
                  {dayEvents.map((event) => {
                    const start = parseISO(event.start);
                    const end = parseISO(event.end);
                    const current =
                      now !== null && start <= now && end > now && !event.allDay;

                    return (
                      <li
                        key={event.id}
                        className={cn(
                          "group flex items-center gap-3.5 px-5 py-3.5 transition-colors",
                          current ? "bg-info/8" : "hover:bg-surface/50",
                        )}
                      >
                        <span className="metrics text-subtle rounded-md border border-border/60 bg-surface/60 px-2 py-0.5 w-28 shrink-0 text-[11px] font-semibold tracking-tight text-center">
                          {event.allDay
                            ? "All day"
                            : `${formatTime(event.start)} – ${formatTime(event.end)}`}
                        </span>
                        <span
                          className={cn(
                            "size-2.5 shrink-0 rounded-full ring-2 ring-[var(--panel)]",
                            colorClasses[event.color],
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13.5px] font-medium text-foreground",
                              current && "font-bold text-info",
                            )}
                          >
                            {event.title}
                          </p>
                          <p className="text-subtle mt-1 flex flex-wrap items-center gap-3 text-[11px]">
                            {event.location ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3 text-subtle" />
                                {event.location}
                              </span>
                            ) : null}
                            {event.attendees ? (
                              <span className="flex items-center gap-1">
                                <Users className="size-3 text-subtle" />
                                {event.attendees}
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1">
                              <Clock className="size-3 text-subtle" />
                              {event.calendar}
                            </span>
                          </p>
                        </div>
                        {current ? (
                          <Badge variant="info" className="font-bold tracking-wider uppercase text-[10px]">
                            Now
                          </Badge>
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
