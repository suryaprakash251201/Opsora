import { describe, expect, it } from "vitest";
import { formatAlertText, selectFreshAlerts } from "./alert-dispatcher";
import type { AttentionItem } from "@/lib/attention/types";

function item(overrides: Partial<AttentionItem> = {}): AttentionItem {
  return {
    id: "item-1",
    source: "servers",
    severity: "critical",
    title: "atlas disk at 91%",
    detail: "9.4 GB free of 106.8 GB",
    href: "/servers",
    score: 105,
    createdAt: "2026-09-10T10:00:00.000Z",
    ...overrides,
  };
}

describe("formatAlertText", () => {
  it("formats severity, details and a link", () => {
    const text = formatAlertText(item(), "http://opsora.local:3000/");
    const lines = text.split("\n");

    expect(lines[0]).toBe("🔴 Opsora · atlas disk at 91%");
    expect(lines[1]).toBe("9.4 GB free of 106.8 GB");
    expect(lines[2]).toBe("http://opsora.local:3000/servers");
  });

  it("includes context when present", () => {
    const text = formatAlertText(item({ context: "atlas.lan" }));
    expect(text).toContain("· atlas.lan");
  });
});

describe("selectFreshAlerts", () => {
  const items = [
    item({ id: "a", severity: "critical" }),
    item({ id: "b", severity: "warning" }),
    item({ id: "c", severity: "info" }),
    item({ id: "d", severity: "success" }),
  ];

  it("only returns unseen attention items by default", () => {
    const { fresh, nextSeen } = selectFreshAlerts(items, ["a"]);

    expect(fresh.map((entry) => entry.id)).toEqual(["b"]);
    expect(nextSeen).toEqual(["a", "b"]);
  });

  it("includes everything at level all", () => {
    const { fresh } = selectFreshAlerts(items, [], "all");
    expect(fresh.map((entry) => entry.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns nothing when everything has been seen", () => {
    const { fresh } = selectFreshAlerts(items, ["a", "b"]);
    expect(fresh).toEqual([]);
  });

  it("forgets resolved alerts so they can notify again", () => {
    const { fresh, nextSeen } = selectFreshAlerts(items, ["a", "b", "stale"]);
    expect(fresh).toEqual([]);
    expect(nextSeen).toEqual(["a", "b"]);

    const recurred = selectFreshAlerts(
      [...items, item({ id: "stale", severity: "critical" })],
      nextSeen,
    );
    expect(recurred.fresh.map((entry) => entry.id)).toEqual(["stale"]);
  });
});
