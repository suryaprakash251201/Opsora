"use client";

import { useEffect } from "react";
import { useThemeStore, applyTheme } from "@/stores/theme-store";

/**
 * Applies the persisted theme on mount and keeps <html> in sync with every
 * future store change — so theme switches are instant, without a reload.
 */
export function ThemeBootstrap() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
