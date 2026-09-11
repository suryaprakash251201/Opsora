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
