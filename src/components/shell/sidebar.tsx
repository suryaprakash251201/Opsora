"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  CircleCheck,
  TriangleAlert,
} from "lucide-react";
import { useAttention } from "@/hooks/use-attention";
import {
  accentVar,
  bottomNav,
  isActivePath,
  navGroups,
  type NavItem,
} from "@/components/shell/nav";
import { ThemeSwitcher } from "@/components/shell/theme-switcher";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function HealthCard() {
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

  return (
    <Link
      href="/alerts"
      className="group border-border/70 bg-surface/40 hover:bg-surface relative flex items-center gap-2.5 overflow-hidden rounded-lg border px-3 py-2.5 transition-colors"
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-0.5 transition-all",
          health === "critical"
            ? "bg-danger"
            : health === "warning"
              ? "bg-warning"
              : "bg-success",
        )}
        aria-hidden
      />
      <Icon
        className={cn(
          "relative size-4 shrink-0 transition-transform group-hover:scale-110",
          isLoading ? "text-subtle" : meta.text,
        )}
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

function NavItemLink({
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
        "group relative flex items-center gap-2.5 rounded-md py-1.5 text-[13px] transition-all",
        collapsed ? "justify-center px-0" : "px-2",
        active
          ? "bg-surface text-foreground"
          : "text-muted hover:bg-surface/60 hover:text-foreground",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className={cn(
            "absolute rounded-full",
            collapsed
              ? "inset-x-1 top-0 h-0.5"
              : "inset-y-1 left-0 w-0.5",
          )}
          style={{ background: accent }}
        />
      ) : null}
      <Icon
        className={cn(
          "shrink-0 transition-transform group-hover:scale-110",
          collapsed ? "size-4" : "size-4",
          active ? "" : "text-subtle",
        )}
        style={active ? { color: accent } : undefined}
      />
      <span
        className={cn(
          "flex-1 truncate overflow-hidden whitespace-nowrap transition-all duration-300",
          collapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100",
        )}
      >
        {item.label}
      </span>
      {item.shortcut && !collapsed ? (
        <kbd className="text-subtle border-border bg-surface/80 hidden rounded border px-1 font-mono text-[10px] group-hover:inline-block">
          {item.shortcut}
        </kbd>
      ) : null}
    </Link>
  );

  if (!collapsed) return link;

  // When collapsed we render a slim icon-only link wrapped in a tooltip-like
  // span so the label appears on hover via a CSS pseudo-tooltip.
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
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {navGroups.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex} className="flex flex-col gap-1">
          {group.label && !collapsed ? (
            <p className="text-subtle px-2 pb-1 text-[10px] font-medium tracking-widest uppercase">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavItemLink
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
          "border-border/70 text-subtle hover:border-border-strong hover:text-muted relative flex items-center overflow-hidden rounded-lg border border-dashed text-xs transition-colors",
          collapsed
            ? "h-9 justify-center px-0"
            : "justify-center gap-2 px-2 py-2",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[var(--brand-soft)] to-transparent opacity-0 transition-opacity hover:opacity-100"
        />
        <PlusIcon className="relative size-3.5" />
        <span
          className={cn(
            "relative whitespace-nowrap transition-all duration-300",
            collapsed
              ? "pointer-events-none w-0 overflow-hidden opacity-0"
              : "opacity-100",
          )}
        >
          New todo
        </span>
        {!collapsed ? (
          <kbd className="border-border bg-surface/80 relative rounded border px-1 font-mono text-[10px]">
            N
          </kbd>
        ) : null}
      </button>
    </nav>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SidebarFooter({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="border-border/70 flex flex-col gap-2 border-t px-3 py-3">
      {!collapsed ? <HealthCard /> : null}
      {bottomNav.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        const accent = accentVar[item.accent];

        const link = (
          <Link
            key={item.href}
            href={item.href}
            style={
              active
                ? ({ ["--accent" as string]: accent } as React.CSSProperties)
                : undefined
            }
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md py-1.5 text-[13px] transition-all",
              collapsed ? "justify-center px-0" : "px-2",
              active
                ? "bg-surface text-foreground"
                : "text-muted hover:bg-surface/60 hover:text-foreground",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className={cn(
                  "absolute rounded-full",
                  collapsed
                    ? "inset-x-1 top-0 h-0.5"
                    : "inset-y-1 left-0 w-0.5",
                )}
                style={{ background: accent }}
              />
            ) : null}
            <Icon
              className="size-4 shrink-0 transition-transform group-hover:scale-110"
              style={active ? { color: accent } : { color: "var(--subtle)" }}
            />
            <span
              className={cn(
                "flex-1 truncate overflow-hidden whitespace-nowrap transition-all duration-300",
                collapsed
                  ? "pointer-events-none w-0 opacity-0"
                  : "opacity-100",
              )}
            >
              {item.label}
            </span>
          </Link>
        );

        if (!collapsed) return <div key={item.href}>{link}</div>;

        return (
          <span key={item.href} className="group/tooltip relative">
            {link}
            <span
              role="tooltip"
              className="bg-foreground text-background pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100"
            >
              {item.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function CollapseToggle({ collapsed }: { collapsed: boolean }) {
  const toggle = useUiStore((state) => state.toggleSidebarCollapsed);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand (⌘\\)" : "Collapse (⌘\\)"}
      className={cn(
        "text-subtle hover:text-foreground hover:bg-surface absolute -right-3 top-9 z-10 flex size-6 items-center justify-center rounded-full border bg-[var(--panel)] shadow-md transition-all",
        "hover:scale-110",
      )}
    >
      {collapsed ? (
        <ChevronsRight className="size-3" />
      ) : (
        <ChevronsLeft className="size-3" />
      )}
    </button>
  );
}

export function SidebarContent({
  onNavigate,
  collapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-panel relative flex h-full flex-col overflow-hidden transition-[width] duration-300 ease-out",
      )}
    >
      {/* Subtle gradient halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--brand) 14%, transparent), transparent)",
        }}
      />

      <div
        className={cn(
          "border-border/70 relative flex items-center gap-2.5 border-b",
          collapsed ? "justify-center px-2 py-4" : "px-5 py-4",
        )}
      >
        <span
          className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md text-sm font-semibold text-white"
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
            "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300",
            collapsed
              ? "pointer-events-none w-0 opacity-0"
              : "opacity-100",
          )}
        >
          <span className="block truncate text-sm leading-tight font-semibold tracking-tight">
            Opsora
          </span>
          <span className="text-subtle block truncate text-[10px] tracking-widest uppercase">
            Command Center
          </span>
        </span>
        {!collapsed ? (
          <span className="ml-auto">
            <ThemeSwitcher trigger="icon" />
          </span>
        ) : null}
      </div>

      <NavLinks onNavigate={onNavigate} collapsed={collapsed ?? false} />

      <SidebarFooter collapsed={collapsed ?? false} />
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUiStore();

  return (
    <>
      {/* Desktop: floating rounded rail */}
      <aside
        className={cn(
          "hidden shrink-0 transition-[width,padding] duration-300 ease-out lg:block",
          sidebarCollapsed ? "w-[68px] pl-4 py-4" : "w-[244px] pl-4 py-4",
        )}
        aria-label="Primary navigation"
      >
        <div
          className={cn(
            "bg-panel border-border relative h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border shadow-[0_8px_32px_-12px_color-mix(in_oklab,var(--brand)_25%,transparent),0_2px_8px_-2px_rgba(0,0,0,0.4)] transition-[width] duration-300 ease-out",
            sidebarCollapsed ? "w-[68px]" : "w-[240px]",
          )}
        >
          <CollapseToggle collapsed={sidebarCollapsed} />
          <SidebarContent collapsed={sidebarCollapsed} />
        </div>
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
          <div className="animate-rise-in border-border bg-panel absolute top-0 left-0 h-dvh w-64 border-r shadow-2xl">
            <SidebarContent
              collapsed={false}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
