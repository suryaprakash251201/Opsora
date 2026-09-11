/**
 * Theme catalog — plain data, no "use client", safe to import from both
 * server components (pre-hydration bootstrap script) and client stores.
 * Single source of truth so adding a theme never requires touching
 * localStorage-parsing scripts by hand.
 */

export const THEMES = [
  { id: "opsora", label: "Opsora", hint: "Dark · indigo · default", mode: "dark" },
  { id: "aurora", label: "Midnight Aurora", hint: "Dark · violet + cyan", mode: "dark" },
  { id: "abyss", label: "Abyss", hint: "Dark · teal + blue", mode: "dark" },
  { id: "forest", label: "Forest", hint: "Dark · emerald + violet", mode: "dark" },
  { id: "solar", label: "Solar Light", hint: "Light · warm · high contrast", mode: "light" },
  { id: "porcelain", label: "Porcelain", hint: "Light · cool · indigo", mode: "light" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type ThemeMode = "dark" | "light";

export const DEFAULT_DARK: ThemeId = "opsora";
export const DEFAULT_LIGHT: ThemeId = "solar";

/** Background color per theme — mirrored into <meta name="theme-color">. */
export const THEME_COLORS: Record<ThemeId, string> = {
  opsora: "#08080b",
  aurora: "#06070d",
  abyss: "#050913",
  forest: "#08120e",
  solar: "#f7f6f2",
  porcelain: "#f4f5f8",
};

export function isValidTheme(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEMES as readonly { id: string }[]).some((t) => t.id === value)
  );
}

export function themeMode(theme: ThemeId): ThemeMode {
  return (THEMES.find((t) => t.id === theme)?.mode ?? "dark") as ThemeMode;
}
