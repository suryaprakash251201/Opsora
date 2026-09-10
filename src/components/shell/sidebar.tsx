"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { useAttention } from "@/hooks/use-attention";
import { bottomNav, isActivePath, navGroups } from "@/components/shell/nav";
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
      className="border-border/70 bg-surface/40 hover:bg-surface flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
    >
      <Icon
        className={cn("size-4 shrink-0", isLoading ? "text-subtle" : meta.text)}
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const openTodoDialog = useUiStore((state) => state.openTodoDialog);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {navGroups.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex} className="flex flex-col gap-1">
          {group.label ? (
            <p className="text-subtle px-2 pb-1 text-[10px] font-medium tracking-widest uppercase">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-surface text-foreground"
                    : "text-muted hover:bg-surface/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-foreground" : "text-subtle",
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut ? (
                  <kbd className="text-subtle border-border bg-surface/80 hidden rounded border px-1 font-mono text-[10px] group-hover:inline-block">
                    {item.shortcut}
                  </kbd>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          openTodoDialog();
          setCommandOpen(false);
          onNavigate?.();
        }}
        className="border-border/70 text-subtle hover:border-border-strong hover:text-muted flex items-center justify-center gap-2 rounded-lg border border-dashed px-2 py-2 text-xs transition-colors"
      >
        New todo
        <kbd className="border-border bg-surface/80 rounded border px-1 font-mono text-[10px]">
          N
        </kbd>
      </button>
    </nav>
  );
}

function SidebarFooter() {
  const pathname = usePathname();

  return (
    <div className="border-border/70 flex flex-col gap-2 border-t px-3 py-3">
      <HealthCard />
      {bottomNav.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
              active
                ? "bg-surface text-foreground"
                : "text-muted hover:bg-surface/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0 text-subtle" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="bg-panel flex h-full flex-col">
      <div className="border-border/70 flex items-center gap-2.5 border-b px-5 py-4">
        <span className="bg-foreground text-background flex size-7 items-center justify-center rounded-md text-sm font-semibold">
          ◈
        </span>
        <span>
          <span className="block text-sm leading-tight font-semibold tracking-tight">
            Opsora
          </span>
          <span className="text-subtle block text-[10px] tracking-widest uppercase">
            Command Center
          </span>
        </span>
      </div>

      <NavLinks onNavigate={onNavigate} />

      <SidebarFooter />
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      <aside className="border-border bg-panel hidden w-60 shrink-0 border-r lg:block">
        <div className="sticky top-0 h-dvh">
          <SidebarContent />
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="animate-overlay-in absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="animate-rise-in border-border bg-panel absolute top-0 left-0 h-dvh w-64 border-r">
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
