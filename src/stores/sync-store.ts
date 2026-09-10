"use client";

import { create } from "zustand";

export interface SyncState {
  serverMode: "sqlite" | "json" | null;
  status: "idle" | "syncing" | "synced" | "error";
  lastSyncedAt: string | null;
  error: string | null;
  setSync: (patch: SyncPatch) => void;
}

export type SyncPatch = Partial<Omit<SyncState, "setSync">>;

export const useSyncStore = create<SyncState>()((set) => ({
  serverMode: null,
  status: "idle",
  lastSyncedAt: null,
  error: null,
  setSync: (patch) => set(patch),
}));
