"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  THEME_COLORS,
  isValidTheme,
  themeMode,
  type ThemeId,
} from "@/lib/theme-config";

interface ThemeState {
  theme: ThemeId;
  /** Last dark/light picks so the quick toggle restores the user's vibe. */
  lastDark: ThemeId;
  lastLight: ThemeId;
  setTheme: (theme: ThemeId) => void;
  /** Flip dark ↔ light, restoring the last theme of that mode. */
  toggleMode: () => void;
}

/** Imperatively apply the theme to <html> — safe to call any time. */
export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = themeMode(theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_DARK,
      lastDark: DEFAULT_DARK,
      lastLight: DEFAULT_LIGHT,

      setTheme: (theme) => {
        if (!isValidTheme(theme)) return;
        const mode = themeMode(theme);
        // Apply immediately — this is what makes switching feel instant.
        applyTheme(theme);
        set(
          mode === "dark"
            ? { theme, lastDark: theme }
            : { theme, lastLight: theme },
        );
      },

      toggleMode: () => {
        const { theme, lastDark, lastLight } = get();
        const next = themeMode(theme) === "dark" ? lastLight : lastDark;
        get().setTheme(next);
      },
    }),
    {
      name: "opsora.theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        lastDark: state.lastDark,
        lastLight: state.lastLight,
      }),
      version: 2,
    },
  ),
);
