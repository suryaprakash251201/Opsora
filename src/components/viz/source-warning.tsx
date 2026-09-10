"use client";

import { CircleAlert } from "lucide-react";
import type { Snapshot } from "@/lib/adapters/types";

/** Shows a warning when a live source failed and mock data is being shown. */
export function SourceWarning({
  snapshot,
  className,
}: {
  snapshot?: Pick<Snapshot<unknown>, "status" | "error" | "source">;
  className?: string;
}) {
  if (!snapshot || snapshot.status !== "error") return null;

  return (
    <div
      className={`border-warning/25 bg-warning/5 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 ${className ?? ""}`}
    >
      <CircleAlert className="text-warning mt-0.5 size-4 shrink-0" />
      <p className="text-xs">
        <span className="text-warning font-medium">
          Live {snapshot.source} unavailable.
        </span>{" "}
        <span className="text-muted">
          Showing demo data until it recovers.
          {snapshot.error ? ` (${snapshot.error})` : ""}
        </span>
      </p>
    </div>
  );
}
