"use client";

import { useState } from "react";
import { Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSourceStatus } from "@/hooks/use-snapshot";

export function AlertChannels() {
  const { data } = useSourceStatus();
  const channels = data?.channels ?? [];
  const configuredCount = channels.filter((channel) => channel.configured).length;
  const [sending, setSending] = useState(false);

  const sendTest = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/alerts/test", { method: "POST" });
      const payload = (await response.json()) as {
        results?: { id: string; ok: boolean; error?: string }[];
        message?: string;
      };

      if (!response.ok) {
        toast.error(payload.message ?? "No channels configured");
        return;
      }

      const failed = (payload.results ?? []).filter((result) => !result.ok);
      if (failed.length === 0) {
        toast.success("Test sent to all channels");
      } else {
        toast.error(
          `Failed: ${failed.map((result) => `${result.id} (${result.error})`).join(", ")}`,
        );
      }
    } catch {
      toast.error("Could not reach the alert dispatcher");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Send className="text-subtle size-3.5" />
          Alert channels
        </CardTitle>
        <Badge variant={configuredCount > 0 ? "success" : "outline"}>
          {configuredCount > 0 ? `${configuredCount} configured` : "none"}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <p className="text-muted text-xs">
          The server checks the attention feed every minute and pushes new
          critical or warning signals to your channels. First run only records
          the current state, so you won&apos;t get a flood on startup.
        </p>

        <div className="flex flex-col gap-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="border-border/60 bg-surface/30 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div>
                <p className="text-xs font-medium">{channel.label}</p>
                <code className="text-subtle font-mono text-[10px]">
                  {channel.hint}
                </code>
              </div>
              <Badge variant={channel.configured ? "success" : "outline"}>
                {channel.configured ? "configured" : "not set"}
              </Badge>
            </div>
          ))}
        </div>

        {configuredCount === 0 ? (
          <p className="text-subtle flex items-start gap-1.5 text-xs">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            Add credentials to .env.local and restart to enable server-side
            alerts.
          </p>
        ) : null}

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void sendTest()}
            disabled={sending || configuredCount === 0}
            title={
              configuredCount === 0
                ? "Add channel credentials to .env.local and restart the server"
                : undefined
            }
          >
            <Send />
            {sending ? "Sending…" : "Send test"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
