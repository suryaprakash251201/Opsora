"use client";

import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/viz/status-dot";
import { useSourceStatus } from "@/hooks/use-snapshot";
import { formatDuration, timeAgo } from "@/lib/format";

export function SourceHealth() {
  const { data, isLoading } = useSourceStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Activity className="text-subtle size-3.5" />
          Source health
        </CardTitle>
        {data ? (
          <span className="text-subtle metrics text-xs">
            app up {formatDuration(data.uptimeSeconds)}
          </span>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </>
        ) : (
          <>
            {data.sources.map((source) => (
              <div
                key={source.id}
                className="border-border/60 bg-surface/30 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <StatusDot
                    status={source.status === "ok" ? "healthy" : "warning"}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {source.label}
                    </p>
                    <p className="text-subtle truncate text-[11px]">
                      {source.description}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={source.mode === "live" ? "success" : "outline"}>
                    {source.mode}
                  </Badge>
                  <span className="metrics text-subtle text-[11px]">
                    {source.latencyMs} ms
                  </span>
                </div>
              </div>
            ))}

            <div className="border-border/60 mt-1 border-t pt-2">
              <p className="text-subtle mb-1.5 text-[11px] tracking-wide uppercase">
                Agent hosts
              </p>
              {data.agents.length === 0 ? (
                <p className="text-subtle text-xs">
                  No agents yet. Run{" "}
                  <code className="font-mono">
                    node agent/opsora-agent.mjs
                  </code>
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.agents.map((agent) => (
                    <div
                      key={agent.hostname}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <StatusDot
                          status={agent.online ? "healthy" : "critical"}
                          pulse={agent.online}
                        />
                        <span className="truncate">{agent.hostname}</span>
                        <span className="text-subtle hidden truncate sm:inline">
                          {agent.os}
                        </span>
                      </span>
                      <span className="text-subtle shrink-0">
                        {timeAgo(agent.receivedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
