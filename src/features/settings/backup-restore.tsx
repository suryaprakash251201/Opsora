"use client";

import { useRef, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  FileJson,
  RotateCcw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTodoStore } from "@/features/todos/store";
import type { Todo } from "@/features/todos/types";
import { useThemeStore } from "@/stores/theme-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface BackupFile {
  schemaVersion: 1;
  exportedAt: string;
  exportedBy: "opsora";
  appVersion?: string;
  preferences?: {
    theme?: string | null;
    sidebarCollapsed?: boolean;
  };
  todos: unknown[];
}

interface RestoreSummary {
  ok: boolean;
  count: number;
  message: string;
}

interface RestorePreset {
  id: "fresh" | "inbox";
  label: string;
  description: string;
  accent: string;
  build: () => BackupFile;
}

function buildEmptyBackup(): BackupFile {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: "opsora",
    todos: [],
  };
}

const RESTORE_PRESETS: (RestorePreset & { build: () => BackupFile })[] = [
  {
    id: "inbox",
    label: "Start with empty inbox",
    description: "Clear all tasks but keep preferences.",
    accent: "var(--accent-settings)",
    build: buildEmptyBackup,
  },
];

export function BackupRestore() {
  const todoCount = useTodoStore((state) => state.todos.length);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"download" | "restore" | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<"fresh" | "inbox" | null>(
    null,
  );
  const [restorePreview, setRestorePreview] = useState<{
    file: BackupFile;
    summary: RestoreSummary;
  } | null>(null);

  /* ------------------------------------------------------------------ */
  /* Download                                                            */
  /* ------------------------------------------------------------------ */

  const downloadBackup = async () => {
    setBusy("download");
    try {
      // Ask the server for the authoritative todo snapshot, then merge in
      // the locally persisted preferences (theme, sidebar collapse) so the
      // backup is a complete picture of the device state.
      const theme = useThemeStore.getState().theme;
      const sidebarCollapsed = useUiStore.getState().sidebarCollapsed;

      const response = await fetch("/api/backup", { method: "GET" });
      if (!response.ok) throw new Error("Server rejected the backup request");

      const envelope = (await response.json()) as BackupFile;
      envelope.preferences = { theme, sidebarCollapsed };

      const blob = new Blob([JSON.stringify(envelope, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opsora-backup-${envelope.exportedAt.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup(envelope.exportedAt);
      toast.success(`Backup downloaded · ${envelope.todos.length} tasks`);
    } catch (error) {
      console.error(error);
      toast.error("Backup failed — check your connection");
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Upload + preview                                                    */
  /* ------------------------------------------------------------------ */

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void ingestFile(file);
    // reset so picking the same file again triggers onChange
    event.target.value = "";
  };

  const ingestFile = async (file: File) => {
    setBusy("restore");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (!isBackupFile(parsed)) {
        toast.error(
          "That file isn't an Opsora backup (schemaVersion: 1 missing)",
        );
        return;
      }

      const todosArray = Array.isArray(parsed.todos) ? parsed.todos : [];
      const summary: RestoreSummary = {
        ok: true,
        count: todosArray.length,
        message:
          todosArray.length === 0
            ? "Empty backup — will clear current tasks."
            : `${todosArray.length} tasks will be restored.`,
      };

      setRestorePreview({ file: parsed, summary });
      toast.success(`Loaded backup from ${new Date(parsed.exportedAt).toLocaleString()}`);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't read the file — is it valid JSON?");
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Apply restore                                                       */
  /* ------------------------------------------------------------------ */

  const applyRestore = async (preset?: "fresh" | "inbox") => {
    setBusy("restore");
    try {
      let payload: BackupFile | null = null;

      if (preset) {
        // Build a synthetic backup from a preset
        payload =
          RESTORE_PRESETS.find((candidate) => candidate.id === preset)?.build() ??
          null;
      } else if (restorePreview) {
        payload = restorePreview.file;
      }

      if (!payload) return;

      const response = await fetch("/api/backup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorBody.error ?? "Restore failed");
      }

      const result = (await response.json()) as {
        ok: boolean;
        count: number;
      };

      // Hydrate the client store from the same data
      useTodoStore.setState({
        todos: payload.todos.filter(isValidTodoShape),
      });

      // Restore preferences if present
      if (payload.preferences?.theme) {
        useThemeStore.getState().setTheme(
          payload.preferences.theme as Parameters<
            ReturnType<typeof useThemeStore.getState>["setTheme"]
          >[0],
        );
      }
      if (typeof payload.preferences?.sidebarCollapsed === "boolean") {
        useUiStore
          .getState()
          .setSidebarCollapsed(payload.preferences.sidebarCollapsed);
      }

      toast.success(
        preset === "inbox"
          ? "Inbox cleared"
          : preset === "fresh"
            ? `Restored demo tasks · ${result.count} items`
            : `Restored ${result.count} tasks`,
      );
      setRestorePreview(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Restore failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const cancelRestore = () => setRestorePreview(null);

  return (
    <Card accent="var(--brand-2)">
      <CardHeader>
        <CardTitle>
          <Archive className="text-subtle size-3.5" />
          Backup &amp; restore
        </CardTitle>
        <Badge variant={lastBackup ? "success" : "outline"}>
          {lastBackup
            ? `Saved ${new Date(lastBackup).toLocaleDateString()}`
            : "no backup yet"}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="text-muted text-xs">
          Export every task and your preferences as a single JSON file, or
          restore from a previous backup. Backups include theme and sidebar
          state so a new device can be set up in one click.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            size="sm"
            onClick={downloadBackup}
            disabled={busy !== null}
            className="w-full"
          >
            <Download className="size-3.5" />
            {busy === "download" ? "Preparing…" : `Download backup (${todoCount} tasks)`}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
            className="w-full"
          >
            <Upload className="size-3.5" />
            Restore from file…
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        {/* Restore preview */}
        {restorePreview ? (
          <div
            className="rounded-lg border p-3 text-xs"
            style={{
              background:
                "color-mix(in oklab, var(--brand) 6%, transparent)",
              borderColor:
                "color-mix(in oklab, var(--brand) 25%, var(--border))",
            }}
          >
            <div className="flex items-center gap-2">
              <FileJson
                className="size-4"
                style={{ color: "var(--brand)" }}
              />
              <p className="font-medium">
                Backup from{" "}
                {new Date(restorePreview.file.exportedAt).toLocaleString()}
              </p>
            </div>
            <ul className="text-subtle mt-1.5 ml-6 list-disc space-y-0.5">
              <li>{restorePreview.summary.message}</li>
              <li>
                Schema v{restorePreview.file.schemaVersion}
                {restorePreview.file.appVersion
                  ? ` · app ${restorePreview.file.appVersion}`
                  : ""}
              </li>
              {restorePreview.file.preferences?.theme ? (
                <li>Theme: {restorePreview.file.preferences.theme}</li>
              ) : null}
            </ul>

            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelRestore}
                disabled={busy !== null}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void applyRestore()}
                disabled={busy !== null}
              >
                <CheckCircle2 className="size-3.5" />
                {busy === "restore" ? "Restoring…" : "Apply restore"}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Presets */}
        <div>
          <p className="text-subtle mb-2 text-[10px] font-medium tracking-widest uppercase">
            Quick presets
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RESTORE_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                preset={preset}
                disabled={busy !== null}
                onClick={() => setPendingPreset(preset.id)}
              />
            ))}
          </div>
        </div>

        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border p-3 text-xs",
            "border-warning/20 bg-warning/5 text-warning",
          )}
        >
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
          <p>
            <span className="font-medium">Heads up:</span> restoring replaces
            every task currently stored on the server. There&apos;s no undo —
            download a backup first if you want a safety net.
          </p>
        </div>
      </CardContent>

      {/* Preset confirmation — wiping tasks is destructive, so ask first. */}
      <Dialog
        open={pendingPreset !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPreset(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start with an empty inbox?</DialogTitle>
            <DialogDescription>
              This deletes all {todoCount} task{todoCount === 1 ? "" : "s"} on
              this device and the server. Your theme and sidebar preferences are
              kept. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingPreset(null)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy !== null}
              onClick={() => {
                const preset = pendingPreset;
                setPendingPreset(null);
                if (preset) void applyRestore(preset);
              }}
            >
              <RotateCcw />
              {busy === "restore" ? "Clearing…" : "Clear all tasks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PresetButton({
  preset,
  disabled,
  onClick,
}: {
  preset: (typeof RESTORE_PRESETS)[number];
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all",
        "border-border bg-surface/30 hover:bg-surface-hover",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <span
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{
          background: `color-mix(in oklab, ${preset.accent} 14%, transparent)`,
          color: preset.accent,
        }}
      >
        <RotateCcw className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{preset.label}</span>
        <span className="text-subtle block text-[11px]">
          {preset.description}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === 1 &&
    typeof v.exportedAt === "string" &&
    v.exportedBy === "opsora"
  );
}

function isValidTodoShape(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.title === "string";
}


