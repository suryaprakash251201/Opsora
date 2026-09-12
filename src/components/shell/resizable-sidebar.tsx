"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronsRight } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface ResizableSidebarProps {
  /** Min rail width when collapsed (icon-only). */
  minCollapsedWidth?: number;
  /** Max expanded width the user can drag to. */
  maxWidth?: number;
  /** Default expanded width in pixels. */
  defaultWidth?: number;
  children: (state: SidebarState) => React.ReactNode;
}

export interface SidebarState {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  width: number;
  setWidth: (width: number) => void;
}

export function ResizableSidebar({
  minCollapsedWidth = 68,
  maxWidth = 320,
  defaultWidth = 244,
  children,
}: ResizableSidebarProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const toggleCollapsed = useUiStore(
    (state) => state.toggleSidebarCollapsed,
  );
  const width = useUiStore((state) => state.sidebarWidth);
  const setWidth = useUiStore((state) => state.setSidebarWidth);
  const railRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    if (!drag) return;

    const handleMove = (event: PointerEvent) => {
      const delta = event.clientX - drag.startX;
      const next = Math.min(
        maxWidth,
        Math.max(minCollapsedWidth + 16, drag.startWidth + delta),
      );
      setWidth(next);
    };

    const handleUp = () => setDrag(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [drag, maxWidth, minCollapsedWidth, setWidth]);

  // First-render initialisation: pick the user's saved width or the default.
  useEffect(() => {
    if (width === 0) setWidth(defaultWidth);
  }, [width, defaultWidth, setWidth]);

  const state: SidebarState = {
    collapsed,
    setCollapsed,
    toggleCollapsed,
    width: collapsed ? minCollapsedWidth : width,
    setWidth,
  };

  return (
    /*
     * The rail is wrapped in a non-clipping shell so the collapse handle can
     * sit half outside the rail's rounded edge. Previously the handle lived
     * inside the `overflow-hidden` rail, so its clickable centre was clipped
     * away and the button could not be pressed.
     */
    <div
      ref={railRef}
      className="relative h-full shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ width: state.width }}
    >
      <div
        className={cn(
          "surface-glass border-border relative flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-[0_8px_32px_-12px_color-mix(in_oklab,var(--brand)_25%,transparent),0_2px_8px_-2px_color-mix(in_oklab,var(--foreground)_22%,transparent)]",
        )}
      >
        {children(state)}

        {/* Resize handle — only meaningful when expanded. */}
        {!collapsed ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              setDrag({
                startX: event.clientX,
                startWidth: state.width,
              });
            }}
            className="group/resize absolute top-0 right-0 z-30 h-full w-1.5 cursor-col-resize"
          >
            <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-transparent transition-colors group-hover/resize:bg-[var(--brand)]/60" />
            <span className="bg-background border-border/70 absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rounded-md border p-0.5 opacity-0 shadow-sm transition-opacity group-hover/resize:opacity-100">
              <ChevronsRight className="text-subtle size-3" />
            </span>
          </div>
        ) : null}
      </div>

      <SidebarCollapseHandle
        collapsed={collapsed}
        onToggle={toggleCollapsed}
      />
    </div>
  );
}

export function SidebarCollapseHandle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar (⌘\\)" : "Collapse sidebar (⌘\\)"}
      className={cn(
        "group/rail-handle absolute top-1/2 right-0 z-40 flex size-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border outline-none",
        "transition-[border-color,box-shadow] duration-200 ease-out",
        "hover:border-[color-mix(in_oklab,var(--brand)_65%,var(--border-strong))]",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
      )}
      style={{
        borderColor:
          "color-mix(in oklab, var(--brand) 32%, var(--border-strong))",
        background:
          "linear-gradient(160deg, var(--panel-elevated) 0%, var(--panel) 100%)",
        boxShadow:
          "0 6px 18px -6px color-mix(in oklab, var(--foreground) 32%, transparent), inset 0 1px 0 0 color-mix(in oklab, var(--foreground) 6%, transparent), 0 0 0 3px color-mix(in oklab, var(--background) 92%, transparent)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover/rail-handle:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--brand) 45%, transparent) 0%, transparent 70%)",
        }}
      />
      <ChevronLeft
        strokeWidth={2.6}
        className={cn(
          "text-muted group-hover/rail-handle:text-foreground relative size-4 transition-all duration-200",
          collapsed
            ? "rotate-180 group-hover/rail-handle:translate-x-0.5"
            : "group-hover/rail-handle:-translate-x-0.5",
        )}
      />
    </button>
  );
}
