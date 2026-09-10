"use client";

import { useEffect } from "react";
import { useThemeStore, applyTheme } from "@/stores/theme-store";

/**
 * Reads the persisted theme from localStorage on mount and applies it.
 * Kept tiny so it can run in the layout without forcing a hydration
 * mismatch on the rest of the tree.
 */
export function ThemeBootstrap() {
  useEffect(() => {
    const stored = useThemeStore.getState().theme;
    applyTheme(stored);
  }, []);

  return null;
}
