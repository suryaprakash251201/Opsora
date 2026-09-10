"use client";

import { useEffect, useRef } from "react";
import { useAttention } from "@/hooks/use-attention";

/**
 * Fires a browser notification when a new critical or warning signal appears
 * while the dashboard tab is in the background.
 */
export function NotificationWatcher() {
  const { items } = useAttention();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (seen.current === null) {
      seen.current = new Set(items.map((item) => item.id));
      return;
    }

    const seenIds = seen.current;
    const fresh = items.filter(
      (item) =>
        (item.severity === "critical" || item.severity === "warning") &&
        !seenIds.has(item.id),
    );

    for (const item of items) seenIds.add(item.id);

    if (
      fresh.length === 0 ||
      Notification.permission !== "granted" ||
      !document.hidden
    ) {
      return;
    }

    for (const item of fresh.slice(0, 3)) {
      const notification = new Notification(`Opsora · ${item.title}`, {
        body: item.detail ?? "",
        tag: item.id,
      });
      notification.onclick = () => {
        window.focus();
        window.location.href = item.href;
      };
    }
  }, [items]);

  return null;
}
