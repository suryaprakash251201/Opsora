"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TodoStatus } from "@/features/todos/types";

interface UiState {
  /** Mobile drawer open state */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** Desktop sidebar collapsed to icon-rail mode */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  todoDialogOpen: boolean;
  editingTodoId: string | null;
  defaultTodoStatus: TodoStatus;
  openTodoDialog: (todoId?: string, defaultStatus?: TodoStatus) => void;
  setTodoDialogOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),

      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),

      todoDialogOpen: false,
      editingTodoId: null,
      defaultTodoStatus: "inbox",
      openTodoDialog: (todoId, defaultStatus = "inbox") =>
        set({
          todoDialogOpen: true,
          editingTodoId: todoId ?? null,
          defaultTodoStatus: todoId ? "inbox" : defaultStatus,
        }),
      setTodoDialogOpen: (todoDialogOpen) =>
        set({ todoDialogOpen, editingTodoId: null }),
    }),
    {
      name: "opsora.ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      version: 1,
    },
  ),
);
