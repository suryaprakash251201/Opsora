"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  Database,
  Keyboard,
  Palette,
  RotateCcw,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/viz/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/shell/theme-switcher";
import { useTodoStore } from "@/features/todos/store";
import { createSeedTodos } from "@/features/todos/seed";
import { SourceHealth } from "@/features/settings/source-health";
import { SyncStatus } from "@/features/settings/sync-status";
import { AlertChannels } from "@/features/settings/alert-channels";
import { BackupRestore } from "@/features/settings/backup-restore";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";

const sources = [
  {
    id: "servers",
    label: "Linux agent",
    detail: "CPU, memory, disks, processes and services",
  },
  {
    id: "github",
    label: "GitHub",
    detail: "Repositories, pull requests, issues and Actions",
  },
  {
    id: "pihole",
    label: "Pi-hole",
    detail: "DNS queries, blocks, clients and upstream health",
  },
  {
    id: "docker",
    label: "Docker",
    detail: "Containers, health, resource usage and restarts",
  },
  {
    id: "calendar",
    label: "Calendar",
    detail: "Today and the next seven days",
  },
];

const shortcuts = [
  { keys: ["⌘", "K"], label: "Open command palette" },
  { keys: ["/"], label: "Search pages and actions" },
  { keys: ["⌘", "\\"], label: "Toggle sidebar collapse" },
  { keys: ["N"], label: "New task" },
  { keys: ["H"], label: "Go home" },
  { keys: ["T"], label: "Go to todos" },
  { keys: ["C"], label: "Go to calendar" },
  { keys: ["G"], label: "Go to GitHub" },
  { keys: ["D"], label: "Go to Docker" },
  { keys: ["S"], label: "Go to servers" },
  { keys: ["P"], label: "Go to Pi-hole" },
  { keys: ["A"], label: "Go to alerts" },
];

interface PaletteSwatch {
  name: string;
  value: string;
  className: string;
  accent?: boolean;
}

const basePalette: PaletteSwatch[] = [
  { name: "Background", value: "var(--background)", className: "bg-background" },
  { name: "Panel", value: "var(--panel)", className: "bg-panel" },
  { name: "Surface", value: "var(--surface)", className: "bg-surface" },
  { name: "Border", value: "var(--border)", className: "bg-border" },
];

const statusPalette: PaletteSwatch[] = [
  { name: "Success", value: "var(--success)", className: "bg-success" },
  { name: "Warning", value: "var(--warning)", className: "bg-warning" },
  { name: "Danger", value: "var(--danger)", className: "bg-danger" },
  { name: "Info", value: "var(--info)", className: "bg-info" },
];

const accentPalette: PaletteSwatch[] = [
  { name: "Home", value: "var(--accent-home)", className: "bg-accent-home", accent: true },
  { name: "Todos", value: "var(--accent-todos)", className: "bg-accent-todos", accent: true },
  { name: "Calendar", value: "var(--accent-calendar)", className: "bg-accent-calendar", accent: true },
  { name: "GitHub", value: "var(--accent-github)", className: "bg-accent-github", accent: true },
  { name: "Docker", value: "var(--accent-docker)", className: "bg-accent-docker", accent: true },
  { name: "Servers", value: "var(--accent-servers)", className: "bg-accent-servers", accent: true },
  { name: "Pi-hole", value: "var(--accent-pihole)", className: "bg-accent-pihole", accent: true },
  { name: "Alerts", value: "var(--accent-alerts)", className: "bg-accent-alerts", accent: true },
];

export default function SettingsPage() {
  const { data } = useDashboardSnapshot();
  const sourceModes: Record<string, "live" | "mock"> = data
    ? Object.fromEntries(
        Object.entries(data.sources).map(([id, snapshot]) => [
          id,
          snapshot.mode,
        ]),
      )
    : {};
  const liveCount = Object.values(sourceModes).filter(
    (mode) => mode === "live",
  ).length;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Themes, sources, shortcuts and local data."
        accent="var(--accent-settings)"
        actions={<ThemeSwitcher />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <Server className="text-subtle size-3.5" />
              Data sources
            </CardTitle>
            <Badge
              variant={liveCount > 0 ? "success" : "warning"}
            >
              {liveCount > 0 ? `${liveCount} live` : "mock data"}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {sources.map((source) => {
              const mode = sourceModes[source.id] ?? "mock";

              return (
                <div
                  key={source.id}
                  className="border-border/60 bg-surface/30 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] font-medium">
                      {source.label}
                      <Badge variant={mode === "live" ? "success" : "outline"}>
                        {mode}
                      </Badge>
                    </p>
                    <p className="text-subtle truncate text-xs">{source.detail}</p>
                  </div>
                  <code className="text-subtle shrink-0 font-mono text-[10px]">
                    /api/sources/{source.id}
                  </code>
                </div>
              );
            })}
            <p className="text-subtle mt-1 text-xs">
              Sources switch to live automatically, e.g. when the agent reports
              metrics, a Docker socket exists, or <code>GITHUB_TOKEN</code> /{" "}
              <code>PIHOLE_URL</code> is configured. See{" "}
              <code>.env.example</code>.
            </p>
          </CardContent>
        </Card>

        <SourceHealth />

        <div className="flex flex-col gap-4">
          <Card accent="var(--brand)" interactive>
            <CardHeader>
              <CardTitle>
                <Palette className="text-subtle size-3.5" />
                Appearance
              </CardTitle>
              <ThemeSwitcher trigger="button" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-muted text-xs">
                Pick a theme that re-tints every design token — surfaces, brand
                gradient, and per-module accents. Themes are stored on this
                device.
              </p>

              <div>
                <p className="text-subtle mb-1.5 text-[10px] font-medium tracking-widest uppercase">
                  Surfaces
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {basePalette.map((color) => (
                    <PaletteTile key={color.name} color={color} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-subtle mb-1.5 text-[10px] font-medium tracking-widest uppercase">
                  Status
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {statusPalette.map((color) => (
                    <PaletteTile key={color.name} color={color} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-subtle mb-1.5 text-[10px] font-medium tracking-widest uppercase">
                  Module accents
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {accentPalette.map((color) => (
                    <PaletteTile key={color.name} color={color} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Keyboard className="text-subtle size-3.5" />
                Keyboard shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-muted">{shortcut.label}</span>
                  <span className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="border-border bg-surface text-muted rounded border px-1.5 py-0.5 font-mono text-[10px]"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <NotificationSettings />
          <AlertChannels />
        </div>

        <SyncStatus />

        <BackupRestore />

        <Card>
          <CardHeader>
            <CardTitle>
              <Database className="text-subtle size-3.5" />
              Local data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted text-xs">
              The browser keeps an offline copy for instant loads; the server
              SQLite database is the source of truth and syncs across devices.
            </p>
            <div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  useTodoStore.setState({ todos: createSeedTodos() });
                  toast.success("Demo tasks restored");
                }}
              >
                <RotateCcw />
                Reset demo tasks
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Version</span>
              <span className="metrics">0.4.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Framework</span>
              <span>Next.js · React · Tailwind</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Data</span>
              <span>{liveCount > 0 ? `${liveCount} live sources` : "Mock adapters"}</span>
            </div>
            <p className="text-subtle mt-2 leading-relaxed">
              Opsora is a self-hosted personal command center: what needs your
              attention now, from life and infrastructure in one place.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PaletteTile({ color }: { color: PaletteSwatch }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`h-8 rounded-md border border-white/10 ${color.className}`}
      />
      <span className="text-subtle text-[10px]">{color.name}</span>
    </div>
  );
}

function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setSupported(false);
        return;
      }
      setPermission(Notification.permission);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const enable = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      new Notification("Opsora notifications enabled", {
        body: "You will be alerted about critical signals while the tab is in the background.",
      });
    } else {
      toast.error("Notifications were not enabled");
    }
  };

  const test = () => {
    new Notification("Opsora test notification", {
      body: "Critical signals will look like this.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BellRing className="text-subtle size-3.5" />
          Notifications
        </CardTitle>
        <Badge
          variant={
            !supported
              ? "outline"
              : permission === "granted"
                ? "success"
                : permission === "denied"
                  ? "danger"
                  : "default"
          }
        >
          {!supported
            ? "unsupported"
            : permission === "granted"
              ? "enabled"
              : permission === "denied"
                ? "blocked"
                : "not enabled"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted text-xs">
          Opsora watches the attention feed and sends a browser notification when
          a new critical or warning signal appears while the dashboard is in the
          background.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => void enable()}
            disabled={!supported || permission === "granted"}
          >
            Enable notifications
          </Button>
          {permission === "granted" ? (
            <Button variant="secondary" size="sm" onClick={test}>
              Send test
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
