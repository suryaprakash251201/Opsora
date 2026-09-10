import type { Todo } from "@/features/todos/types";

/**
 * Versioned envelope for a full Opsora backup. Designed to stay backwards
 * compatible — readers must be able to ignore unknown fields.
 */
export interface BackupEnvelope {
  schemaVersion: 1;
  exportedAt: string;
  exportedBy: "opsora";
  appVersion: string;
  /** The current UI/theme settings persisted on this device. */
  preferences: {
    theme: string | null;
    sidebarCollapsed: boolean;
  };
  todos: Todo[];
}

export interface BackupReadResult {
  todos: Todo[];
  preferences: BackupEnvelope["preferences"];
  exportedAt: string | null;
}
