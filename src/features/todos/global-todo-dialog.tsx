"use client";

import { TodoDialog } from "@/features/todos/todo-dialog";
import { useTodoStore } from "@/features/todos/store";
import { useUiStore } from "@/stores/ui-store";

export function GlobalTodoDialog() {
  const todoDialogOpen = useUiStore((state) => state.todoDialogOpen);
  const editingTodoId = useUiStore((state) => state.editingTodoId);
  const defaultTodoStatus = useUiStore((state) => state.defaultTodoStatus);
  const setTodoDialogOpen = useUiStore((state) => state.setTodoDialogOpen);
  const todo = useTodoStore(
    (state) => state.todos.find((item) => item.id === editingTodoId) ?? null,
  );

  // Remount the dialog whenever it opens or switches target so the form
  // always starts from the right values without syncing state in an effect.
  const key = todoDialogOpen
    ? (editingTodoId ?? `new-${defaultTodoStatus}`)
    : "closed";

  return (
    <TodoDialog
      key={key}
      open={todoDialogOpen}
      onOpenChange={setTodoDialogOpen}
      todo={todo}
      defaultStatus={defaultTodoStatus}
    />
  );
}
