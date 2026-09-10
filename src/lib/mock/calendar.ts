import { addDays, addHours, addMinutes, startOfToday } from "date-fns";

export type CalendarColor = "info" | "success" | "warning" | "danger" | "muted";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  calendar: string;
  color: CalendarColor;
  location?: string;
  attendees?: number;
  allDay?: boolean;
}

export interface CalendarSnapshot {
  events: CalendarEvent[];
  updatedAt: string;
}

export function getCalendarSnapshot(): CalendarSnapshot {
  const today = startOfToday();
  const at = (day: number, hour: number, minute = 0) =>
    addMinutes(addHours(addDays(today, day), hour), minute).toISOString();
  const endOf = (startIso: string, minutes: number) =>
    addMinutes(new Date(startIso), minutes).toISOString();

  const raw: (Omit<CalendarEvent, "start" | "end"> & {
    start: string;
    durationMinutes: number;
  })[] = [
    {
      id: "ev-1",
      title: "Standup",
      calendar: "Work",
      color: "info",
      start: at(0, 9, 30),
      durationMinutes: 30,
      location: "Meet",
      attendees: 6,
    },
    {
      id: "ev-2",
      title: "Deep work · snapshot uploads",
      calendar: "Focus",
      color: "muted",
      start: at(0, 11),
      durationMinutes: 120,
    },
    {
      id: "ev-3",
      title: "Deploy cloud-dock v0.4.2",
      calendar: "Ops",
      color: "warning",
      start: at(0, 14, 30),
      durationMinutes: 45,
    },
    {
      id: "ev-4",
      title: "1:1 · Aditya",
      calendar: "Work",
      color: "info",
      start: at(0, 16),
      durationMinutes: 30,
      location: "Meet",
      attendees: 2,
    },
    {
      id: "ev-5",
      title: "Gym",
      calendar: "Personal",
      color: "success",
      start: at(0, 18, 30),
      durationMinutes: 60,
      location: "Anytime Fitness",
    },
    {
      id: "ev-6",
      title: "Homelab maintenance window",
      calendar: "Ops",
      color: "warning",
      start: at(0, 21),
      durationMinutes: 60,
    },
    {
      id: "ev-7",
      title: "Dentist",
      calendar: "Personal",
      color: "success",
      start: at(1, 10),
      durationMinutes: 45,
      location: "City Dental",
    },
    {
      id: "ev-8",
      title: "Sprint planning",
      calendar: "Work",
      color: "info",
      start: at(1, 11, 30),
      durationMinutes: 60,
      attendees: 8,
    },
    {
      id: "ev-9",
      title: "Release window · backend-api",
      calendar: "Ops",
      color: "warning",
      start: at(2, 15),
      durationMinutes: 90,
    },
    {
      id: "ev-10",
      title: "Code review block",
      calendar: "Focus",
      color: "muted",
      start: at(2, 9),
      durationMinutes: 120,
    },
    {
      id: "ev-11",
      title: "CloudDock architecture review",
      calendar: "Work",
      color: "info",
      start: at(3, 14),
      durationMinutes: 60,
      attendees: 4,
    },
    {
      id: "ev-12",
      title: "Backup verification",
      calendar: "Ops",
      color: "warning",
      start: at(4, 20),
      durationMinutes: 30,
    },
    {
      id: "ev-13",
      title: "Weekend trip",
      calendar: "Personal",
      color: "success",
      start: at(5, 8),
      durationMinutes: 12 * 60,
      allDay: true,
    },
    {
      id: "ev-14",
      title: "Monthly infra review",
      calendar: "Ops",
      color: "warning",
      start: at(6, 17),
      durationMinutes: 60,
    },
  ];

  const events: CalendarEvent[] = raw.map(({ durationMinutes, ...event }) => ({
    ...event,
    end: endOf(event.start, durationMinutes),
  }));

  return {
    events: events.sort((a, b) => a.start.localeCompare(b.start)),
    updatedAt: new Date().toISOString(),
  };
}
