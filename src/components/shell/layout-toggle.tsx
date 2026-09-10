"use client";

import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface LayoutToggleProps {
  className?: string;
}

/**
 * Header pill that toggles the entire UI density — collapses the sidebar
 * to its icon-rail form so the main content gets a wider canvas. The
 * state is persisted in `useUiStore` and survives reloads.
 *
 * For the *mobile* drawer state use the existing topbar Menu button; this
 * control only affects the desktop sidebar.
 */
export function LayoutToggle({ className }: LayoutToggleProps) {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();
  const Icon = sidebarCollapsed ? Maximize2 : Minimize2;
  const label = sidebarCollapsed
    ? "Expand layout"
    : "Collapse layout";
  const hint = sidebarCollapsed ? "Show sidebar labels" : "Hide sidebar labels";

  return (
    <div
      role="group"
      aria-label="Layout density"
      className={cn(
        "border-border bg-panel relative inline-flex items-center gap-0.5 rounded-full border p-0.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggleSidebarCollapsed}
        aria-label={label}
        aria-pressed={!sidebarCollapsed}
        title={`${hint} (⌘\\)`}
        className={cn(
          "relative z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          sidebarCollapsed
            ? "text-muted hover:text-foreground"
            : "text-foreground",
        )}
      >
        {!sidebarCollapsed ? (
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[var(--surface)] shadow-sm"
            style={{ boxShadow: "0 0 0 1px var(--border)" }}
          />
        ) : null}
        <Icon className="size-3.5" />
        <span className="hidden lg:inline">Collapse</span>
      </button>

      <span
        aria-hidden
        className="bg-border mx-0.5 h-3.5 w-px"
      />

      <button
        type="button"
        onClick={toggleSidebarCollapsed}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={sidebarCollapsed ? "Expand" : "Collapse"}
        className={cn(
          "relative z-10 inline-flex size-6 items-center justify-center rounded-full transition-all hover:scale-110",
          sidebarCollapsed
            ? "text-foreground"
            : "text-muted hover:text-foreground",
        )}
        style={
          sidebarCollapsed
            ? ({
                background: "var(--surface)",
                boxShadow: "0 0 0 1px var(--border)",
              } as React.CSSProperties)
            : undefined
        }
      >
        {sidebarCollapsed ? (
          <ChevronsRight className="size-3" />
        ) : (
          <ChevronsLeft className="size-3" />
        )}
      </button>
    </div>
  );
}

/** Tiny indicator-only icon used inside the topbar in tight layouts. */
export function LayoutToggleIcon({ className }: { className?: string }) {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();
  const Icon = sidebarCollapsed ? ChevronsRight : ChevronsLeft;

  return (
    <button
      type="button"
      onClick={toggleSidebarCollapsed}
      aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={
        sidebarCollapsed
          ? "Expand layout (⌘\\)"
          : "Collapse layout (⌘\\)"
      }
      className={cn(
        "border-border bg-panel hover:bg-surface-hover text-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md border transition-all hover:scale-105",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Visual label rendered inside the dashboard body to advertise density. */
export function LayoutHint({ className }: { className?: string }) {
  const { sidebarCollapsed } = useUiStore();
  if (sidebarCollapsed) return null;
  return (
    <span
      className={cn(
        "text-subtle inline-flex items-center gap-1 text-[10px] tracking-widest uppercase",
        className,
      )}
    >
      <LayoutDashboard className="size-3" />
      Full layout
    </span>
  );
}
