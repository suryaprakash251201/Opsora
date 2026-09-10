"use client";

import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  todoDialogOpen: boolean;
  editingTodoId: string | null;
  openTodoDialog: (todoId?: string) => void;
  setTodoDialogOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  todoDialogOpen: false,
  editingTodoId: null,
  openTodoDialog: (todoId) =>
    set({ todoDialogOpen: true, editingTodoId: todoId ?? null }),
  setTodoDialogOpen: (todoDialogOpen) =>
    set({ todoDialogOpen, editingTodoId: null }),
}));
