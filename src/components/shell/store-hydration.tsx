"use client";

import { useEffect } from "react";
import { useTodoStore } from "@/features/todos/store";

/** Rehydrates persisted stores after the first client render. */
export function StoreHydration() {
  useEffect(() => {
    void useTodoStore.persist.rehydrate();
  }, []);

  return null;
}
