"use client";

import { Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { syncNow } from "@/features/todos/sync";
import { timeAgo } from "@/lib/format";
import { useSyncStore } from "@/stores/sync-store";

export function SyncStatus() {
  const { status, serverMode, lastSyncedAt, error } = useSyncStore();

  const variant =
    status === "synced"
      ? "success"
      : status === "error"
        ? "danger"
        : status === "syncing"
          ? "info"
          : "outline";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Database className="text-subtle size-3.5" />
          Task sync
        </CardTitle>
        <Badge variant={variant}>{status}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Server store</span>
            <span className="metrics">
              {serverMode === "sqlite"
                ? "SQLite"
                : serverMode === "json"
                  ? "JSON file"
                  : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Last sync</span>
            <span>{lastSyncedAt ? timeAgo(lastSyncedAt) : "never"}</span>
          </div>
          {error ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Last error</span>
              <span className="text-danger truncate">{error}</span>
            </div>
          ) : null}
        </div>

        <p className="text-subtle text-xs">
          Tasks persist in SQLite on the server (`.data/opsora.db`) and sync to
          every browser you open. Changes are pushed with a short debounce.
        </p>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void (async () => {
                await syncNow();
                const state = useSyncStore.getState();
                if (state.status === "synced") toast.success("Tasks synced");
                else toast.error(state.error ?? "Sync failed");
              })();
            }}
          >
            <RefreshCw />
            Sync now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
