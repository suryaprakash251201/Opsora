import type { ReactNode } from "react";
import { CommandPalette } from "@/components/shell/command-palette";
import { LiveStreamProvider } from "@/components/shell/live-stream-provider";
import { Sidebar } from "@/components/shell/sidebar";
import { StoreHydration } from "@/components/shell/store-hydration";
import { ThemeBootstrap } from "@/components/shell/theme-bootstrap";
import { Topbar } from "@/components/shell/topbar";
import { NotificationWatcher } from "@/features/alerts/notification-watcher";
import { GlobalTodoDialog } from "@/features/todos/global-todo-dialog";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh">
      {/* Ambient multi-color background that responds to the active theme. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--background)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(1200px 600px at 0% -10%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 60%), radial-gradient(900px 500px at 100% 0%, color-mix(in oklab, var(--brand-2) 18%, transparent), transparent 60%), radial-gradient(800px 400px at 50% 110%, color-mix(in oklab, var(--accent-home) 14%, transparent), transparent 60%)",
        }}
      />

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 lg:px-6">
          {children}
        </main>
      </div>

      <CommandPalette />
      <GlobalTodoDialog />
      <NotificationWatcher />
      <LiveStreamProvider />
      <StoreHydration />
      <ThemeBootstrap />
    </div>
  );
}
