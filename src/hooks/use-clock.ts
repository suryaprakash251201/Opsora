"use client";

import { useEffect, useState } from "react";

/** Returns null until mounted so server and client markup match. */
export function useClock(intervalMs = 15_000) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const frame = requestAnimationFrame(update);
    const timer = setInterval(update, intervalMs);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
