"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Todo, TodoPriority, TodoStatus } from "./types";

export interface NewTodoInput {
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  dueDate?: string;
  project?: string;
  tags?: string[];
}

interface TodoStore {
  todos: Todo[];
  addTodo: (input: NewTodoInput) => string;
  updateTodo: (id: string, patch: Partial<Omit<Todo, "id">>) => void;
  toggleTodo: (id: string) => void;
  setStatus: (id: string, status: TodoStatus) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `todo-${Math.random().toString(36).slice(2, 10)}`;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      // Starts empty — real tasks hydrate from the server via startTodoSync().
      todos: [],

      addTodo: (input) => {
        const id = newId();
        const todo: Todo = {
          id,
          title: input.title.trim(),
          description: input.description?.trim() || undefined,
          status: input.status ?? "inbox",
          priority: input.priority ?? "medium",
          dueDate: input.dueDate,
          project: input.project?.trim() || undefined,
          tags: input.tags ?? [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ todos: [todo, ...state.todos] }));
        return id;
      },

      updateTodo: (id, patch) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, ...patch } : todo,
          ),
        })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.id !== id) return todo;
            const done = todo.status === "done";
            // When reopening, fall back to the status the task held before
            // completion (or "today" if that is no longer a valid state).
            const previousStatus = (todo as Todo & { _previousStatus?: TodoStatus })
              ._previousStatus;
            return {
              ...todo,
              status: done
                ? (previousStatus && previousStatus !== "done"
                    ? previousStatus
                    : "today")
                : "done",
              completedAt: done ? undefined : new Date().toISOString(),
            };
          }),
        })),

      setStatus: (id, status) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  status,
                  completedAt:
                    status === "done"
                      ? (todo.completedAt ?? new Date().toISOString())
                      : undefined,
                }
              : todo,
          ),
        })),

      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),

      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.status !== "done"),
        })),
    }),
    {
      name: "opsora.todos",
      version: 1,
      skipHydration: true,
    },
  ),
);
