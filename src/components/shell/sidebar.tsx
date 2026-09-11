"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleAlert,
  CircleCheck,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { LiveLogo } from "@/components/icons/live";
import { useAttention } from "@/hooks/use-attention";
import {
  accentVar,
  bottomNav,
  isActivePath,
  navGroups,
  type NavItem,
} from "@/components/shell/nav";
import {
  ResizableSidebar,
  type SidebarState,
} from "@/components/shell/resizable-sidebar";
import { ThemeSwitcher } from "@/components/shell/theme-switcher";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function HealthCard({ collapsed }: { collapsed: boolean }) {
  const { health, summary, isLoading } = useAttention();

  const meta =
    health === "critical"
      ? {
          icon: TriangleAlert,
          text: "text-danger",
          label: `${summary.critical} critical`,
          hint: `${summary.needsAttention} need attention`,
        }
      : health === "warning"
        ? {
            icon: CircleAlert,
            text: "text-warning",
            label: `${summary.needsAttention} need attention`,
            hint: `${summary.critical} critical · ${summary.warning} warning`,
          }
        : {
            icon: CircleCheck,
            text: "text-success",
            label: "All systems healthy",
            hint: `${summary.total} signals checked`,
          };

  const Icon = meta.icon;

  if (collapsed) {
    return (
      <Link
        href="/alerts"
        aria-label={meta.label}
        title={meta.label}
        className="group border-border/60 bg-surface/40 hover:bg-surface hover:border-border-strong relative mx-auto flex size-11 items-center justify-center rounded-xl border transition-all"
      >
        <Icon
          className={cn(
            "size-5 shrink-0 transition-transform group-hover:scale-110",
            isLoading ? "text-subtle" : meta.text,
          )}
          strokeWidth={2.2}
        />
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-[var(--panel)]",
            health === "critical"
              ? "bg-danger"
              : health === "warning"
                ? "bg-warning"
                : "bg-success",
          )}
        />
      </Link>
    );
  }

  return (
    <Link
      href="/alerts"
      className="group border-border/60 bg-surface/30 hover:bg-surface relative flex items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 transition-colors"
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-0.5 transition-all"
        style={{
          background: health === "critical"
            ? "var(--danger)"
            : health === "warning"
              ? "var(--warning)"
              : "var(--success)",
        }}
        aria-hidden
      />
      <Icon
        className={cn(
          "size-4.5 shrink-0 transition-transform group-hover:scale-110",
          isLoading ? "text-subtle" : meta.text,
        )}
        strokeWidth={2.2}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">
          {isLoading ? "Checking systems…" : meta.label}
        </span>
        <span className="text-subtle block truncate text-[11px]">
          {isLoading ? "Collecting signals" : meta.hint}
        </span>
      </span>
    </Link>
  );
}

function NavLinkItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const accent = accentVar[item.accent];

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      style={
        active
          ? ({ ["--accent" as string]: accent } as React.CSSProperties)
          : undefined
      }
      className={cn(
        "group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed
          ? "mx-auto size-11 justify-center"
          : "h-10 gap-3 px-3",
        active
          ? cn(
              "text-foreground",
              "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_24%,transparent)]",
            )
          : cn(
              "text-muted hover:text-foreground hover:bg-[var(--surface)]/70",
              !collapsed && "hover:translate-x-0.5",
            ),
      )}
    >
      {active ? (
        <>
          <span
            aria-hidden
            className="animate-[nav-indicator-in_240ms_ease-out] pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 16%, transparent) 0%, color-mix(in oklab, ${accent} 6%, transparent) 100%)`,
            }}
          />
          <span
            aria-hidden
            className={cn(
              "animate-[nav-indicator-in_280ms_ease-out] absolute rounded-full",
              collapsed
                ? "inset-x-2 -bottom-0.5 h-0.5"
                : "-left-px top-1/2 h-5 w-[3px] -translate-y-1/2",
            )}
            style={{
              background: accent,
              boxShadow: `0 0 10px color-mix(in oklab, ${accent} 75%, transparent)`,
            }}
          />
        </>
      ) : null}
      <Icon
        className={cn(
          "relative shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] group-hover:scale-110",
          collapsed ? "size-[22px]" : "size-5",
        )}
        strokeWidth={2}
        style={active ? { color: accent } : { color: "var(--subtle)" }}
      />
      <span
        className={cn(
          "relative truncate whitespace-nowrap transition-[opacity,transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed
            ? "pointer-events-none w-0 -translate-x-1 opacity-0"
            : "translate-x-0 opacity-100",
        )}
      >
        {item.label}
      </span>
      {item.shortcut && !collapsed ? (
        <kbd className="text-subtle border-border bg-background/50 ml-auto hidden rounded border px-1 font-mono text-[10px] group-hover:inline-block">
          {item.shortcut}
        </kbd>
      ) : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <span className="group/tooltip relative block">
      {link}
      <span
        role="tooltip"
        className="bg-foreground text-background pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 shadow-lg transition-all duration-200 ease-out group-hover/tooltip:translate-x-0 group-hover/tooltip:opacity-100"
      >
        {item.label}
        {item.shortcut ? (
          <kbd className="bg-background/15 ml-1.5 rounded px-1 font-mono text-[10px]">
            {item.shortcut}
          </kbd>
        ) : null}
      </span>
    </span>
  );
}

function NavLinks({
  onNavigate,
  collapsed,
}: {
  onNavigate?: () => void;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const openTodoDialog = useUiStore((state) => state.openTodoDialog);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  const scrollRef = useRef<HTMLElement | null>(null);
  const [overflow, setOverflow] = useState({ top: false, bottom: false });

  // Track whether there is content above/below so we can show soft edge
  // fades instead of a visible scrollbar.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const update = () => {
      const top = element.scrollTop > 4;
      const bottom =
        element.scrollTop + element.clientHeight < element.scrollHeight - 4;
      setOverflow((previous) =>
        previous.top === top && previous.bottom === bottom
          ? previous
          : { top, bottom },
      );
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const totalItems = navGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const delayFor = (index: number) => `${Math.min(index * 24, 240)}ms`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Edge fades: scroll affordance without a visible scrollbar. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 h-5 transition-opacity duration-300",
          overflow.top ? "opacity-100" : "opacity-0",
        )}
        style={{
          background: "linear-gradient(to bottom, var(--panel), transparent)",
        }}
      />

      <nav
        ref={scrollRef}
        data-scrollable
        className={cn(
          "scrollbar-hidden flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain py-3",
          collapsed ? "px-2.5" : "px-3",
        )}
      >
        {navGroups.map((group, groupIndex) => {
          const baseIndex = navGroups
            .slice(0, groupIndex)
            .reduce((sum, previous) => sum + previous.items.length, 0);

          return (
            <div key={group.label ?? groupIndex} className="flex flex-col gap-1">
              {group.label ? (
                collapsed ? (
                  <div className="bg-border/50 mx-3 mt-1 mb-0.5 h-px" aria-hidden />
                ) : (
                  <p className="text-subtle mt-2 flex items-center gap-2 px-3 text-[10px] font-semibold tracking-widest uppercase first:mt-0">
                    {group.label}
                    <span aria-hidden className="bg-border/60 h-px flex-1" />
                  </p>
                )
              ) : null}
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.href}
                  className="animate-[nav-item-in_380ms_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: delayFor(baseIndex + itemIndex) }}
                >
                  <NavLinkItem
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    collapsed={collapsed}
                    onClick={onNavigate}
                  />
                </div>
              ))}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => {
            openTodoDialog();
            setCommandOpen(false);
            onNavigate?.();
          }}
          title={collapsed ? "New todo · N" : undefined}
          aria-label="New todo"
          className={cn(
            "group animate-[nav-item-in_380ms_cubic-bezier(0.16,1,0.3,1)_both] border-border/60 text-subtle hover:border-border-strong hover:text-muted relative mt-1.5 flex items-center overflow-hidden rounded-xl border border-dashed text-xs transition-colors duration-300",
            collapsed
              ? "mx-auto size-11 justify-center"
              : "h-10 gap-2.5 px-3",
          )}
          style={{ animationDelay: delayFor(totalItems) }}
        >
          <Plus
            className={cn(
              "shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] group-hover:rotate-90",
              collapsed ? "size-5" : "size-4",
            )}
            strokeWidth={2.4}
          />
          <span
            className={cn(
              "whitespace-nowrap transition-[opacity,transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              collapsed
                ? "pointer-events-none w-0 -translate-x-1 opacity-0"
                : "translate-x-0 opacity-100",
            )}
          >
            New todo
          </span>
          {!collapsed ? (
            <kbd className="border-border bg-background/50 ml-auto rounded border px-1 font-mono text-[10px]">
              N
            </kbd>
          ) : null}
        </button>
      </nav>

      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 h-5 transition-opacity duration-300",
          overflow.bottom ? "opacity-100" : "opacity-0",
        )}
        style={{
          background: "linear-gradient(to top, var(--panel), transparent)",
        }}
      />
    </div>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "border-border/70 flex shrink-0 flex-col gap-1.5 border-t",
        collapsed ? "items-center px-2.5 py-3" : "px-3 py-3",
      )}
    >
      <HealthCard collapsed={collapsed} />
      {bottomNav.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <NavLinkItem
            key={item.href}
            item={item}
            active={active}
            collapsed={collapsed}
          />
        );
      })}
    </div>
  );
}

function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "border-border/70 relative flex shrink-0 items-center gap-2.5 border-b",
        collapsed ? "justify-center px-2.5 py-3" : "px-3.5 py-3",
      )}
    >
      <span
        className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-[0_4px_14px_-2px_color-mix(in_oklab,var(--brand)_45%,transparent)]"
        style={{
          background:
            "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 animate-[shimmer_3.6s_ease_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ backgroundSize: "200% 100%" }}
        />
        <LiveLogo className="relative size-6" strokeWidth={1.6} />
      </span>
      <span
        className={cn(
          "min-w-0 overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100",
        )}
      >
        <span className="block truncate text-sm leading-tight font-semibold tracking-tight">
          Opsora
        </span>
        <span className="text-subtle block truncate text-[10px] font-medium tracking-widest uppercase">
          Command Center
        </span>
      </span>
      {!collapsed ? (
        <span className="ml-auto">
          <ThemeSwitcher trigger="icon" />
        </span>
      ) : null}
    </div>
  );
}

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <SidebarHeader collapsed={collapsed} />
      <NavLinks collapsed={collapsed} onNavigate={onNavigate} />
      <SidebarFooter collapsed={collapsed} />
    </>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      {/* Desktop: floating resizable rail, pinned to the viewport */}
      <aside
        className="sticky top-0 hidden h-dvh shrink-0 self-start transition-[width,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex lg:py-4 lg:pl-4"
        aria-label="Primary navigation"
      >
        <ResizableSidebar>
          {(state: SidebarState) => (
            <SidebarBody collapsed={state.collapsed} />
          )}
        </ResizableSidebar>
      </aside>

      {/* Mobile: drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="animate-rise-in border-border bg-panel absolute top-0 left-0 flex h-dvh w-72 flex-col border-r shadow-2xl">
            <SidebarBody
              collapsed={false}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
