"use client";

import { SourceWarning } from "@/components/viz/source-warning";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";

/** Surfaces any degraded live source on the Home page. */
export function SourceWarnings() {
  const { data } = useDashboardSnapshot();

  if (!data) return null;

  const degraded = Object.values(data.sources).filter(
    (snapshot) => snapshot.status === "error",
  );

  if (degraded.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {degraded.map((snapshot) => (
        <SourceWarning key={snapshot.source} snapshot={snapshot} />
      ))}
    </div>
  );
}
