"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useThemeStore } from "@/stores/theme-store";
import { THEMES, type ThemeId } from "@/lib/theme-config";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
  trigger?: "button" | "icon";
}

const THEME_SWATCHES: Record<ThemeId, { bg: string; accent: string; accent2: string; fg: string }> = {
  opsora: { bg: "#09090b", accent: "#818cf8", accent2: "#c084fc", fg: "#f4f4f5" },
  aurora: { bg: "#06070d", accent: "#7c3aed", accent2: "#06b6d4", fg: "#f1f5fb" },
  abyss: { bg: "#050913", accent: "#2dd4bf", accent2: "#3b82f6", fg: "#e2e8f5" },
  forest: { bg: "#08120e", accent: "#34d399", accent2: "#a78bfa", fg: "#ecfdf5" },
  solar: { bg: "#f7f6f2", accent: "#ea580c", accent2: "#d97706", fg: "#1c1917" },
  porcelain: { bg: "#f4f5f8", accent: "#4f46e5", accent2: "#7c3aed", fg: "#18181f" },
};

export function ThemeSwitcher({ className, trigger = "button" }: ThemeSwitcherProps) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger === "icon" ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Change theme"
          className={className}
          onClick={() => setOpen(true)}
        >
          <Palette className="size-4" />
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          className={className}
        >
          <Palette className="size-3.5" />
          <span>Theme</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a theme</DialogTitle>
            <DialogDescription>
              Each theme re-tints the design tokens — backgrounds, brand, and
              every module accent. Your choice is stored on this device.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {THEMES.map((option) => {
              const swatch = THEME_SWATCHES[option.id as ThemeId];
              const active = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id as ThemeId);
                  }}
                  className={cn(
                    "group border-border bg-surface/40 hover:bg-surface-hover relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                    active &&
                      "ring-2 ring-offset-2 ring-offset-[var(--panel)]",
                  )}
                  style={
                    active
                      ? ({
                          ["--tw-ring-color" as string]:
                            swatch.accent,
                        } as React.CSSProperties)
                      : undefined
                  }
                  aria-pressed={active}
                >
                  <div
                    aria-hidden
                    className="relative h-20 w-full overflow-hidden rounded-lg border border-black/5"
                    style={{
                      background: `linear-gradient(135deg, ${swatch.accent} 0%, ${swatch.accent2} 100%), ${swatch.bg}`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(60% 60% at 30% 30%, color-mix(in oklab, ${swatch.accent} 70%, transparent), transparent)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-end justify-between gap-2 p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: swatch.accent }}
                        />
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: swatch.accent2 }}
                        />
                      </div>
                      <span
                        className="metrics rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          color: swatch.fg,
                          background: "color-mix(in oklab, var(--foreground) 35%, transparent)",
                        }}
                      >
                        Aa
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-[13px] font-medium">
                        {option.label}
                      </p>
                      <p className="text-subtle truncate text-[11px]">
                        {option.hint}
                      </p>
                    </div>
                    {active ? (
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: swatch.accent }}
                      >
                        <Check className="size-3" style={{ color: swatch.fg }} />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
