"use client";

import { useEffect } from "react";
import { useTodoStore } from "@/features/todos/store";
import { startTodoSync } from "@/features/todos/sync";

/** Rehydrates persisted stores after the first client render, then syncs. */
export function StoreHydration() {
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      await useTodoStore.persist.rehydrate();
      if (!cancelled) await startTodoSync();
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
