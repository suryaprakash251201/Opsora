"use client";

import type { Todo } from "@/features/todos/types";
import { useTodoStore } from "@/features/todos/store";
import { useSyncStore, type SyncPatch } from "@/stores/sync-store";

interface TodosResponse {
  todos: Todo[];
  updatedAt: string | null;
  mode: "sqlite" | "json";
}

const PUSH_DEBOUNCE_MS = 800;

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let applyingRemote = false;

function setSync(patch: SyncPatch) {
  useSyncStore.getState().setSync(patch);
}

function schedulePush(delay = PUSH_DEBOUNCE_MS) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void push();
  }, delay);
}

async function push(): Promise<void> {
  if (pushing) {
    schedulePush(300);
    return;
  }

  pushing = true;
  setSync({ status: "syncing" });

  try {
    const response = await fetch("/api/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todos: useTodoStore.getState().todos }),
    });

    if (!response.ok) throw new Error(`Server responded ${response.status}`);

    const payload = (await response.json()) as TodosResponse;
    setSync({
      status: "synced",
      lastSyncedAt: payload.updatedAt ?? new Date().toISOString(),
      error: null,
      serverMode: payload.mode,
    });
  } catch (error) {
    setSync({
      status: "error",
      error: error instanceof Error ? error.message : "Sync failed",
    });
  } finally {
    pushing = false;
  }
}

async function pull(): Promise<void> {
  try {
    const response = await fetch("/api/todos", { cache: "no-store" });
    if (!response.ok) throw new Error(`Server responded ${response.status}`);

    const payload = (await response.json()) as TodosResponse;
    setSync({ serverMode: payload.mode });

    if (payload.todos.length === 0) {
      // First run on this server: upload local tasks if there are any.
      if (useTodoStore.getState().todos.length > 0) {
        await push();
      } else {
        setSync({ status: "synced", lastSyncedAt: new Date().toISOString() });
      }
      return;
    }

    applyingRemote = true;
    useTodoStore.setState({ todos: payload.todos });
    applyingRemote = false;

    setSync({
      status: "synced",
      lastSyncedAt: payload.updatedAt ?? new Date().toISOString(),
      error: null,
    });
  } catch (error) {
    setSync({
      status: "error",
      error: error instanceof Error ? error.message : "Sync failed",
    });
  }
}

/**
 * Starts two-way sync between the local todo store and the server repository.
 * Server state wins on load; local changes are pushed with a short debounce.
 */
export async function startTodoSync(): Promise<void> {
  if (started) return;
  started = true;

  useTodoStore.subscribe((state, previous) => {
    if (applyingRemote || state.todos === previous.todos) return;
    schedulePush();
  });

  await pull();
}

/** Push the current list to the server immediately (used by Settings). */
export async function syncNow(): Promise<void> {
  await push();
}
