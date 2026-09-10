"use client";

import { create } from "zustand";

interface RealtimeState {
  connected: boolean;
  lastEventAt: string | null;
  setRealtime: (patch: Partial<Omit<RealtimeState, "setRealtime">>) => void;
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  connected: false,
  lastEventAt: null,
  setRealtime: (patch) => set(patch),
}));
