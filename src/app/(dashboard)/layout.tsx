import type { ReactNode } from "react";
import { CircuitBackground } from "@/components/shell/circuit-background";
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
    <div className="bg-background relative min-h-dvh text-foreground lg:flex">
      {/* Animated circuit-board layer + ambient brand aura behind everything. */}
      <CircuitBackground />

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pt-4 pb-8 sm:px-5 lg:px-6 lg:pt-5">
          <div className="flex flex-col gap-4 sm:gap-5">{children}</div>
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
