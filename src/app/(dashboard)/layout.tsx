import type { ReactNode } from "react";
import { CommandPalette } from "@/components/shell/command-palette";
import { Sidebar } from "@/components/shell/sidebar";
import { StoreHydration } from "@/components/shell/store-hydration";
import { Topbar } from "@/components/shell/topbar";
import { GlobalTodoDialog } from "@/features/todos/global-todo-dialog";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 lg:px-6">
          {children}
        </main>
      </div>
      <CommandPalette />
      <GlobalTodoDialog />
      <StoreHydration />
    </div>
  );
}
