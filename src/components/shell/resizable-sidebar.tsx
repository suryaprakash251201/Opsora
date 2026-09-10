"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
    <div
      ref={railRef}
      className={cn(
        "bg-panel border-border relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_8px_32px_-12px_color-mix(in_oklab,var(--brand)_25%,transparent),0_2px_8px_-2px_rgba(0,0,0,0.4)]",
        "transition-[width] duration-200 ease-out",
      )}
      style={{ width: state.width }}
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
  );
}

export function SidebarCollapseHandle({
  collapsed,
  onToggle,
  size = "md",
}: {
  collapsed: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}) {
  const Icon = size === "sm" ? ChevronLeft : ChevronsLeft;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand (⌘\\)" : "Collapse (⌘\\)"}
      className={cn(
        "text-subtle hover:text-foreground absolute -right-3 top-12 z-20 flex items-center justify-center rounded-full border bg-[var(--panel)] shadow-lg transition-all",
        "hover:scale-110 hover:shadow-xl",
        "active:scale-95",
        size === "sm" ? "size-6" : "size-7",
      )}
      style={{
        borderColor: "var(--border-strong)",
        boxShadow:
          "0 6px 20px -6px color-mix(in oklab, var(--brand) 30%, transparent), 0 0 0 1px var(--border-strong)",
      }}
    >
      {collapsed ? (
        <ChevronRight className={size === "sm" ? "size-3" : "size-3.5"} />
      ) : (
        <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      )}
    </button>
  );
}
