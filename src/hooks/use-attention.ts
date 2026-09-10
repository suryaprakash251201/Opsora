"use client";

import { useMemo } from "react";
import {
  evaluateAttention,
  overallHealth,
  summarizeAttention,
} from "@/lib/attention/engine";
import { useTodoStore } from "@/features/todos/store";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";

/**
 * Single source of truth for "what needs attention now". Pulls from the
 * cached snapshot (cheap to read across pages) and memoizes each stage
 * independently so referential equality stays stable when an upstream value
 * hasn't changed.
 */
export function useAttention() {
  const query = useDashboardSnapshot();
  const todos = useTodoStore((state) => state.todos);

  const sources = query.data?.sources;

  const items = useMemo(() => {
    if (!sources) return [];
    return evaluateAttention({
      servers: sources.servers.data,
      github: sources.github.data,
      pihole: sources.pihole.data,
      docker: sources.docker.data,
      calendar: sources.calendar.data,
      todos,
    });
  }, [sources, todos]);

  const summary = useMemo(() => summarizeAttention(items), [items]);
  const health = useMemo(() => overallHealth(items), [items]);

  return { ...query, items, summary, health };
}
