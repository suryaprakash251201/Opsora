import { describe, expect, it } from "vitest";
import {
  colorForCalendar,
  mapGoogleEvent,
  mapGoogleEvents,
} from "./calendar";

describe("google calendar mapping", () => {
  it("maps timed events", () => {
    const event = mapGoogleEvent(
      {
        id: "ev-1",
        summary: "Standup",
        location: "Meet",
        start: { dateTime: "2026-09-10T09:30:00+05:30" },
        end: { dateTime: "2026-09-10T10:00:00+05:30" },
        attendees: [{}, {}],
      },
      "Primary",
    );

    expect(event).not.toBeNull();
    expect(event?.title).toBe("Standup");
    expect(event?.allDay).toBe(false);
    expect(event?.attendees).toBe(2);
    expect(event?.location).toBe("Meet");
  });

  it("maps all-day events", () => {
    const event = mapGoogleEvent(
      {
        id: "ev-2",
        summary: "Weekend trip",
        start: { date: "2026-09-12" },
        end: { date: "2026-09-13" },
      },
      "Personal",
    );

    expect(event?.allDay).toBe(true);
    expect(event?.start).toBe("2026-09-12");
  });

  it("drops cancelled and malformed events", () => {
    expect(
      mapGoogleEvent({ id: "x", status: "cancelled" }, "Primary"),
    ).toBeNull();
    expect(mapGoogleEvent({ id: "y" }, "Primary")).toBeNull();
  });

  it("falls back to a placeholder title", () => {
    const event = mapGoogleEvent(
      {
        id: "ev-3",
        start: { dateTime: "2026-09-10T09:30:00Z" },
        end: { dateTime: "2026-09-10T10:00:00Z" },
      },
      "Primary",
    );

    expect(event?.title).toBe("(No title)");
  });

  it("sorts events and assigns stable colors", () => {
    const events = mapGoogleEvents(
      [
        {
          id: "b",
          summary: "Later",
          start: { dateTime: "2026-09-10T12:00:00Z" },
          end: { dateTime: "2026-09-10T13:00:00Z" },
        },
        {
          id: "a",
          summary: "Earlier",
          start: { dateTime: "2026-09-10T08:00:00Z" },
          end: { dateTime: "2026-09-10T09:00:00Z" },
        },
      ],
      "Work",
    );

    expect(events.map((event) => event.id)).toEqual(["a", "b"]);
    expect(colorForCalendar("Work")).toBe(colorForCalendar("Work"));
  });
});
