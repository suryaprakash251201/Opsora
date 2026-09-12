"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme-store";
import { themeMode } from "@/lib/theme-config";
import { cn } from "@/lib/utils";

/**
 * Quick dark/light toggle. Remembers the user's last theme per mode, so
 * flipping to dark restores e.g. "Abyss" rather than resetting to default.
 * For granular theme choice use the ThemeSwitcher (palette in the sidebar).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((state) => state.theme);
  const toggleMode = useThemeStore((state) => state.toggleMode);

  const mode = themeMode(theme);
  const label = mode === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleMode}
      aria-label={label}
      title={`${label} (⌘⇧L)`}
      className={cn("group gap-2", className)}
    >
      <span className="relative flex size-4 items-center justify-center">
        <Sun
          className={cn(
            "absolute size-4 transition-all duration-300",
            mode === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute size-4 transition-all duration-300",
            mode === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
      <span className="hidden md:inline">
        {mode === "dark" ? "Dark" : "Light"}
      </span>
    </Button>
  );
}

/** Segmented dark / light control for settings surfaces. */
export function ThemeSegmented({
  className,
}: {
  className?: string;
}) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const mode = themeMode(theme);

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "border-border bg-panel relative inline-flex items-center gap-0.5 rounded-full border p-0.5",
        className,
      )}
    >
      <SegmentButton
        active={mode === "dark"}
        onClick={() => (mode === "dark" ? setTheme(theme) : toggleMode())}
        ariaLabel="Dark theme"
      >
        <Moon className="size-3.5" />
        <span>Dark</span>
      </SegmentButton>
      <SegmentButton
        active={mode === "light"}
        onClick={() => (mode === "light" ? setTheme(theme) : toggleMode())}
        ariaLabel="Light theme"
      >
        <Sun className="size-3.5" />
        <span>Light</span>
      </SegmentButton>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "relative z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "text-foreground" : "text-muted hover:text-foreground",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-[var(--surface)] shadow-sm"
          style={{
            boxShadow: "0 0 0 1px var(--border)",
          }}
        />
      ) : null}
      {children}
    </button>
  );
}
