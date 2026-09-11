import { addDays, startOfToday } from "date-fns";
import type { Snapshot, SourceAdapter } from "@/lib/adapters/types";
import type {
  CalendarColor,
  CalendarEvent,
  CalendarSnapshot,
} from "@/lib/types/calendar";

const CACHE_TTL_MS = 300_000;
const EVENT_LIMIT = 50;

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId?: string;
}

export interface GoogleEventDateTime {
  dateTime?: string;
  date?: string;
}

export interface GoogleEvent {
  id: string;
  summary?: string;
  location?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
  attendees?: unknown[];
  status?: string;
}

const COLORS: CalendarColor[] = ["info", "success", "warning", "muted"];

export function colorForCalendar(input: string): CalendarColor {
  let hash = 0;
  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) % 997;
  }
  return COLORS[hash % COLORS.length];
}

export function mapGoogleEvent(
  event: GoogleEvent,
  calendarLabel: string,
): CalendarEvent | null {
  if (event.status === "cancelled") return null;

  const startDate = event.start?.date;
  const startDateTime = event.start?.dateTime;
  const endDate = event.end?.date;
  const endDateTime = event.end?.dateTime;

  const allDay = Boolean(startDate && !startDateTime);
  const start = startDateTime ?? startDate;
  const end = endDateTime ?? endDate;
  if (!start || !end) return null;

  return {
    id: event.id,
    title: event.summary?.trim() || "(No title)",
    start,
    end,
    calendar: calendarLabel,
    color: colorForCalendar(calendarLabel),
    location: event.location?.trim() || undefined,
    attendees: event.attendees?.length || undefined,
    allDay,
  };
}

export function mapGoogleEvents(
  events: GoogleEvent[],
  calendarLabel: string,
): CalendarEvent[] {
  return events
    .map((event) => mapGoogleEvent(event, calendarLabel))
    .filter((event): event is CalendarEvent => event !== null)
    .sort((a, b) => a.start.localeCompare(b.start));
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

async function fetchAccessToken(
  config: GoogleCalendarConfig,
): Promise<{ token: string; expiresAt: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      `Google token refresh failed: ${payload.error_description ?? payload.error ?? response.status}`,
    );
  }

  return {
    token: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3_600) * 1000,
  };
}

export function createGoogleCalendarAdapter(
  config: GoogleCalendarConfig,
): SourceAdapter<CalendarSnapshot> {
  const calendarId = config.calendarId ?? "primary";
  const calendarLabel = calendarId === "primary" ? "Primary" : calendarId;
  let token: { token: string; expiresAt: number } | null = null;
  let cache: { at: number; data: CalendarSnapshot } | null = null;

  return {
    id: "calendar",
    label: "Google Calendar",
    description: "Live events from Google Calendar",
    mode: "live",
    async getSnapshot(): Promise<Snapshot<CalendarSnapshot>> {
      const started = performance.now();

      if (!cache || Date.now() - cache.at >= CACHE_TTL_MS) {
        if (!token || Date.now() >= token.expiresAt - 60_000) {
          token = await fetchAccessToken(config);
        }

        const timeMin = startOfToday().toISOString();
        const timeMax = addDays(startOfToday(), 8).toISOString();
        const params = new URLSearchParams({
          singleEvents: "true",
          orderBy: "startTime",
          timeMin,
          timeMax,
          maxResults: String(EVENT_LIMIT),
        });

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token.token}` },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `Google Calendar responded with ${response.status}: ${body.slice(0, 120)}`,
          );
        }

        const payload = (await response.json()) as { items?: GoogleEvent[] };
        cache = {
          at: Date.now(),
          data: {
            events: mapGoogleEvents(payload.items ?? [], calendarLabel),
            updatedAt: new Date().toISOString(),
          },
        };
      }

      return {
        source: "calendar",
        data: cache.data,
        fetchedAt: new Date(cache.at).toISOString(),
        status: "ok",
        mode: "live",
        latencyMs: Math.round(performance.now() - started),
      };
    },
  };
}
