"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleAlert,
  CircleCheck,
  Plus,
  TriangleAlert,
  Wifi,
} from "lucide-react";
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
  SidebarCollapseHandle,
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
        className="group border-border/60 bg-surface/40 hover:bg-surface relative flex size-10 items-center justify-center rounded-xl border transition-colors"
      >
        <Icon
          className={cn(
            "size-4.5 shrink-0 transition-transform group-hover:scale-110",
            isLoading ? "text-subtle" : meta.text,
          )}
          strokeWidth={2.2}
        />
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2",
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
          "size-4 shrink-0 transition-transform group-hover:scale-110",
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
        "group relative flex items-center rounded-lg py-2 text-[13px] font-medium transition-all",
        collapsed ? "justify-center" : "gap-2.5 pl-2.5 pr-2",
        active
          ? cn(
              "text-foreground",
              "bg-[var(--surface)]",
              "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_18%,transparent)]",
            )
          : "text-muted hover:text-foreground hover:bg-[var(--surface)]/60",
      )}
    >
      {active ? (
        <>
          <span
            aria-hidden
            className={cn(
              "absolute rounded-full transition-all",
              collapsed
                ? "inset-x-1.5 top-1.5 h-0.5"
                : "inset-y-1.5 left-0 w-0.5",
            )}
            style={{ background: accent }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg opacity-50"
            style={{
              background: `color-mix(in oklab, ${accent} 8%, transparent)`,
            }}
          />
        </>
      ) : null}
      <Icon
        className={cn(
          "shrink-0 transition-transform duration-200 group-hover:scale-110",
          collapsed ? "size-[20px]" : "size-[18px]",
        )}
        strokeWidth={1.8}
        style={active ? { color: accent } : { color: "var(--subtle)" }}
      />
      <span
        className={cn(
          "truncate whitespace-nowrap transition-all duration-200",
          collapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100",
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
    <span className="group/tooltip relative">
      {link}
      <span
        role="tooltip"
        className="bg-foreground text-background pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100"
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

  return (
    <nav
      data-scrollable
      className="flex flex-1 min-h-0 flex-col gap-1.5 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-width:thin] [scrollbar-color:var(--border-strong)_transparent]"
    >
      {navGroups.map((group, groupIndex) => (
        <div
          key={group.label ?? groupIndex}
          className="flex flex-col gap-0.5"
        >
          {group.label && !collapsed ? (
            <p className="text-subtle mt-1 mb-0.5 px-2.5 text-[10px] font-semibold tracking-widest uppercase first:mt-0">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavLinkItem
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              collapsed={collapsed}
              onClick={onNavigate}
            />
          ))}
        </div>
      ))}

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
          "border-border/60 text-subtle hover:border-border-strong hover:text-muted relative flex items-center overflow-hidden rounded-lg border border-dashed text-xs transition-colors",
          collapsed
            ? "mt-2 h-9 justify-center"
            : "mt-2 gap-2 px-2.5 py-2",
        )}
      >
        <Plus
          className={cn("shrink-0", collapsed ? "size-4" : "size-3.5")}
          strokeWidth={2.4}
        />
        <span
          className={cn(
            "whitespace-nowrap transition-all duration-200",
            collapsed ? "pointer-events-none w-0 overflow-hidden opacity-0" : "opacity-100",
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
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "border-border/70 flex flex-col gap-2 border-t",
        collapsed ? "items-center px-2 py-3" : "px-3 py-3",
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

function SidebarHeader({
  collapsed,
  toggleCollapsed,
}: {
  collapsed: boolean;
  toggleCollapsed: () => void;
}) {
  return (
    <div
      className={cn(
        "border-border/70 relative flex items-center gap-2.5 border-b",
        collapsed ? "justify-center px-2 py-3" : "px-4 py-3",
      )}
    >
      <span
        className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold text-white shadow-[0_4px_12px_-2px_color-mix(in_oklab,var(--brand)_45%,transparent)]"
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
        <span className="relative">◈</span>
      </span>
      <span
        className={cn(
          "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-200",
          collapsed
            ? "pointer-events-none w-0 opacity-0"
            : "opacity-100",
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
      <SidebarCollapseHandle
        collapsed={collapsed}
        onToggle={toggleCollapsed}
      />
    </div>
  );
}

function SidebarBody({ state, onNavigate }: { state: SidebarState; onNavigate?: () => void }) {
  return (
    <>
      <SidebarHeader
        collapsed={state.collapsed}
        toggleCollapsed={state.toggleCollapsed}
      />
      <NavLinks collapsed={state.collapsed} onNavigate={onNavigate} />
      <SidebarFooter collapsed={state.collapsed} />
    </>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      {/* Desktop: floating resizable rail */}
      <aside
        className="hidden shrink-0 self-stretch transition-[width,padding] duration-200 ease-out lg:flex lg:pl-4 lg:py-4"
        aria-label="Primary navigation"
      >
        <ResizableSidebar>
          {(state) => <SidebarBody state={state} />}
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
          <div className="animate-rise-in border-border bg-panel absolute top-0 left-0 h-dvh w-72 border-r shadow-2xl">
            <SidebarBody state={{ collapsed: false, width: 288 } as SidebarState} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

/* Re-export for any caller that wants the brand mark. */
export { Wifi };
