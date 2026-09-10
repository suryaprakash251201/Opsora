"use client";

import { useMemo } from "react";
import {
  evaluateAttention,
  overallHealth,
  summarizeAttention,
} from "@/lib/attention/engine";
import { useTodoStore } from "@/features/todos/store";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";

export function useAttention() {
  const query = useDashboardSnapshot();
  const todos = useTodoStore((state) => state.todos);

  const items = useMemo(() => {
    if (!query.data) return [];
    const { sources } = query.data;

    return evaluateAttention({
      servers: sources.servers.data,
      github: sources.github.data,
      pihole: sources.pihole.data,
      docker: sources.docker.data,
      calendar: sources.calendar.data,
      todos,
    });
  }, [query.data, todos]);

  const summary = useMemo(() => summarizeAttention(items), [items]);
  const health = useMemo(() => overallHealth(items), [items]);

  return { ...query, items, summary, health };
}
