"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const THEMES = [
  { id: "opsora", label: "Opsora", hint: "Dark · indigo · default" },
  { id: "aurora", label: "Midnight Aurora", hint: "Dark · violet + cyan" },
  { id: "abyss", label: "Abyss", hint: "Dark · teal + blue" },
  { id: "forest", label: "Forest", hint: "Dark · emerald + violet" },
  { id: "solar", label: "Solar Light", hint: "Light · warm · high contrast" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "opsora",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "opsora.theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      version: 1,
    },
  ),
);

/** Imperatively apply the theme to <html> — used for SSR-safe bootstrapping. */
export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}
