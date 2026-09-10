"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DashboardSnapshot } from "@/hooks/use-snapshot";
import { useRealtimeStore } from "@/stores/realtime-store";

/** Subscribes to /api/stream and writes updates straight into the query cache. */
export function useLiveStream() {
  const queryClient = useQueryClient();
  const setRealtime = useRealtimeStore((state) => state.setRealtime);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      source = new EventSource("/api/stream");

      source.addEventListener("snapshot", (event) => {
        try {
          const payload = JSON.parse(
            (event as MessageEvent).data,
          ) as DashboardSnapshot;

          queryClient.setQueryData(["snapshot"], payload);
          for (const [key, snapshot] of Object.entries(payload.sources)) {
            queryClient.setQueryData(["source", key], snapshot);
          }
          setRealtime({ connected: true, lastEventAt: payload.fetchedAt });
        } catch {
          // ignore malformed frames; the next tick will resend
        }
      });

      source.onerror = () => {
        setRealtime({ connected: false });
        source?.close();
        source = null;
        if (!disposed) retry = setTimeout(connect, 5_000);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retry) clearTimeout(retry);
      source?.close();
      setRealtime({ connected: false });
    };
  }, [queryClient, setRealtime]);
}
