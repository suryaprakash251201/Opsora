"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BellRing,
  Check,
  Copy,
  Database,
  Keyboard,
  MonitorSmartphone,
  Palette,
  RotateCcw,
  Send,
  Server,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/viz/page-header";
import { SectionHeader } from "@/components/viz/section";
import { StatTile } from "@/components/viz/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LiveCalendar,
  LiveDocker,
  LiveGithub,
  LiveServer,
  LiveShield,
} from "@/components/icons/live";
import { ThemeSegmented } from "@/components/shell/theme-toggle";
import { ThemeSwitcher } from "@/components/shell/theme-switcher";
import { accentVar } from "@/components/shell/nav";
import { useTodoStore } from "@/features/todos/store";
import { syncNow } from "@/features/todos/sync";
import { useSyncStore } from "@/stores/sync-store";
import { THEMES, useThemeStore } from "@/stores/theme-store";
import { SourceHealth } from "@/features/settings/source-health";
import { SyncStatus } from "@/features/settings/sync-status";
import { AlertChannels } from "@/features/settings/alert-channels";
import { BackupRestore } from "@/features/settings/backup-restore";
import { useSourceStatus } from "@/hooks/use-snapshot";
import { cn } from "@/lib/utils";

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

const sourceVisuals: Record<
  string,
  { icon: typeof LiveServer; accent: string }
> = {
  servers: { icon: LiveServer, accent: accentVar.servers },
  github: { icon: LiveGithub, accent: accentVar.github },
  pihole: { icon: LiveShield, accent: accentVar.pihole },
  docker: { icon: LiveDocker, accent: accentVar.docker },
  calendar: { icon: LiveCalendar, accent: accentVar.calendar },
};

const shortcuts = [
  { keys: ["⌘", "K"], label: "Command palette" },
  { keys: ["/"], label: "Search" },
  { keys: ["⌘", "\\"], label: "Toggle sidebar" },
  { keys: ["⌘", "⇧", "L"], label: "Toggle light/dark" },
  { keys: ["N"], label: "New task" },
  { keys: ["H"], label: "Home" },
  { keys: ["T"], label: "Todos" },
  { keys: ["C"], label: "Calendar" },
  { keys: ["G"], label: "GitHub" },
  { keys: ["D"], label: "Docker" },
  { keys: ["S"], label: "Servers" },
  { keys: ["P"], label: "Pi-hole" },
  { keys: ["A"], label: "Alerts" },
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
  const { data } = useSourceStatus();
  const syncStatus = useSyncStore((state) => state.status);

  const sourceModes: Record<string, "live" | "empty"> = data
    ? Object.fromEntries(data.sources.map((s) => [s.id, s.mode]))
    : {};
  const liveCount = Object.values(sourceModes).filter(
    (mode) => mode === "live",
  ).length;
  const totalSources = data?.sources.length ?? sources.length;
  const agentsOnline =
    data?.agents.filter((agent) => agent.online).length ?? 0;
  const configuredChannels =
    data?.channels.filter((channel) => channel.configured).length ?? 0;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Sources, appearance, notifications and local data."
        accent="var(--accent-settings)"
        actions={<ThemeSwitcher />}
      />

      {/* ————— at-a-glance strip ————— */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Live sources"
          value={liveCount}
          unit={`/ ${totalSources}`}
          icon={Activity}
          accent="var(--accent-servers)"
          footer={liveCount === totalSources ? "everything connected" : "configure in .env"}
        />
        <StatTile
          label="Agent hosts"
          value={agentsOnline}
          unit={data?.agents.length ? `/ ${data.agents.length}` : ""}
          icon={Server}
          accent="var(--accent-home)"
          footer={agentsOnline > 0 ? "reporting live metrics" : "no agent connected"}
        />
        <StatTile
          label="Task sync"
          value={data ? syncStatus : "—"}
          icon={Database}
          accent="var(--accent-todos)"
          footer="SQLite on the server"
        />
        <StatTile
          label="Alert channels"
          value={configuredChannels}
          unit="/ 2"
          icon={Send}
          accent="var(--accent-alerts)"
          footer={configuredChannels > 0 ? "ready to notify" : "none configured"}
        />
      </div>

      {/* ————— Connections ————— */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Connections"
          description="Where Opsora pulls live data from and how healthy each source is."
          icon={Server}
        />
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <DataSourcesCard sourceModes={sourceModes} liveCount={liveCount} />
          <SourceHealth />
        </div>
      </section>

      {/* ————— Appearance & notifications ————— */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Appearance & notifications"
          description="Theme, browser alerts and server-side delivery channels."
          icon={Palette}
        />
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <div className="flex flex-col gap-4">
            <AppearanceCard />
            <KeyboardShortcutsCard />
          </div>
          <div className="flex flex-col gap-4">
            <NotificationSettings />
            <AlertChannels />
          </div>
        </div>
      </section>

      {/* ————— Data & storage ————— */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Data & storage"
          description="Sync state, backups and the local browser copy."
          icon={Database}
        />
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SyncStatus />
            <LocalDataCard />
            {data?.desktop?.active ? (
              <DesktopCard
                dataDir={data.desktop.dataDir}
                configFile={data.desktop.configFile}
              />
            ) : null}
          </div>
          <BackupRestore />
        </div>
      </section>

      {/* ————— About ————— */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="About" icon={Sparkles} />
        <AboutCard
          liveCount={liveCount}
          totalSources={totalSources}
          version={data?.version}
        />
      </section>
    </>
  );
}

/* —————————————————————————————————————————————————————————— */

function DataSourcesCard({
  sourceModes,
  liveCount,
}: {
  sourceModes: Record<string, "live" | "empty">;
  liveCount: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Server className="text-subtle size-3.5" />
          Data sources
        </CardTitle>
        <Badge variant={liveCount > 0 ? "success" : "warning"}>
          {liveCount > 0 ? `${liveCount} live` : "not configured"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sources.map((source) => {
          const mode = sourceModes[source.id] ?? "empty";
          const visual = sourceVisuals[source.id];
          const Icon = visual.icon;

          return (
            <div
              key={source.id}
              className={cn(
                "group border-border/60 bg-surface/30 hover:bg-surface/60 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                mode === "live" && "border-border-strong/60",
              )}
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                style={{
                  color: visual.accent,
                  background: `color-mix(in oklab, ${visual.accent} 13%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${visual.accent} 24%, transparent)`,
                }}
              >
                <Icon className="size-4.5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13px] font-medium">
                  {source.label}
                  <Badge variant={mode === "live" ? "success" : "outline"}>
                    {mode}
                  </Badge>
                </p>
                <p className="text-subtle truncate text-xs">{source.detail}</p>
              </div>
              <code className="text-subtle hidden shrink-0 font-mono text-[10px] sm:block">
                /api/sources/{source.id}
              </code>
            </div>
          );
        })}
        <p className="text-subtle mt-1 text-xs leading-relaxed">
          Sources switch to live automatically, e.g. when the agent reports
          metrics, a Docker socket exists, or <code>GITHUB_TOKEN</code> /{" "}
          <code>PIHOLE_URL</code> is configured. See <code>.env.example</code>.
        </p>
      </CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const theme = useThemeStore((state) => state.theme);
  const current = THEMES.find((option) => option.id === theme);

  return (
    <Card accent="var(--brand)" interactive>
      <CardHeader>
        <CardTitle>
          <Palette className="text-subtle size-3.5" />
          Appearance
        </CardTitle>
        <ThemeSwitcher trigger="button" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-subtle text-xs">Quick switch</p>
          <ThemeSegmented />
        </div>
        <div className="border-border/60 bg-surface/30 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
          <div>
            <p className="text-[13px] font-medium">{current?.label ?? theme}</p>
            <p className="text-subtle text-xs">{current?.hint}</p>
          </div>
          <Badge variant="brand">
            {current?.mode === "light" ? "light" : "dark"}
          </Badge>
        </div>

        <p className="text-muted text-xs">
          Each theme re-tints every design token — surfaces, brand gradient and
          per-module accents. Stored on this device.
        </p>

        <PaletteGroup title="Surfaces" swatches={basePalette} />
        <PaletteGroup title="Status" swatches={statusPalette} />
        <PaletteGroup title="Module accents" swatches={accentPalette} />
      </CardContent>
    </Card>
  );
}

function PaletteGroup({
  title,
  swatches,
}: {
  title: string;
  swatches: PaletteSwatch[];
}) {
  return (
    <div>
      <p className="text-subtle mb-1.5 text-[10px] font-medium tracking-widest uppercase">
        {title}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {swatches.map((color) => (
          <PaletteTile key={color.name} color={color} />
        ))}
      </div>
    </div>
  );
}

function PaletteTile({ color }: { color: PaletteSwatch }) {
  return (
    <div className="group/tile flex flex-col gap-1" title={color.value}>
      <span
        className={cn(
          "h-9 rounded-lg border border-white/10 transition-transform duration-200 group-hover/tile:scale-[1.04]",
          color.className,
        )}
        style={{
          boxShadow: color.accent
            ? `0 4px 12px -6px color-mix(in oklab, ${color.value} 60%, transparent)`
            : undefined,
        }}
      />
      <span className="text-subtle truncate text-[10px]">{color.name}</span>
    </div>
  );
}

function LocalDataCard() {
  const todoCount = useTodoStore((state) => state.todos.length);
  const completedCount = useTodoStore(
    (state) => state.todos.filter((todo) => todo.status === "done").length,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<"clear" | "completed" | null>(null);

  const pushAndReport = async (message: string) => {
    await syncNow();
    const state = useSyncStore.getState();
    if (state.status === "synced") toast.success(message);
    else toast.error(state.error ?? "Saved locally — server sync failed");
  };

  const clearCompleted = async () => {
    setBusy("completed");
    useTodoStore.getState().clearCompleted();
    await pushAndReport("Completed tasks removed");
    setBusy(null);
  };

  const clearAll = async () => {
    setBusy("clear");
    useTodoStore.setState({ todos: [] });
    await pushAndReport("All tasks cleared and synced");
    setBusy(null);
    setConfirmOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Database className="text-subtle size-3.5" />
          Local data
        </CardTitle>
        <Badge variant="outline">{todoCount} tasks</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted text-xs leading-relaxed">
          The browser keeps an offline copy for instant loads; the server SQLite
          database is the source of truth and syncs across devices. Destructive
          actions are pushed to the server immediately.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null || completedCount === 0}
            onClick={() => void clearCompleted()}
          >
            <RotateCcw />
            {busy === "completed"
              ? "Removing…"
              : `Clear completed (${completedCount})`}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busy !== null || todoCount === 0}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 />
            Clear all tasks
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all tasks?</DialogTitle>
            <DialogDescription>
              This removes {todoCount} task{todoCount === 1 ? "" : "s"} from
              this device and the server database. There is no undo — download a
              backup first if you want a safety net.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void clearAll()}
              disabled={busy !== null}
            >
              <Trash2 />
              {busy === "clear" ? "Clearing…" : "Yes, clear everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DesktopCard({
  dataDir,
  configFile,
}: {
  dataDir: string | null;
  configFile: string | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      toast.success("Path copied");
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy — select the path manually");
    }
  };

  return (
    <Card accent="var(--accent-settings)">
      <CardHeader>
        <CardTitle>
          <MonitorSmartphone className="text-subtle size-3.5" />
          Desktop app
        </CardTitle>
        <Badge variant="brand">native window</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted text-xs leading-relaxed">
          This dashboard is running inside the bundled Opsora desktop app. Server
          data and source configuration live in your OS app-data folder, so
          updating the app never wipes them.
        </p>

        {configFile ? (
          <PathRow
            label="Source config"
            hint="opsora.env — tokens, Pi-hole URL, alert channels"
            value={configFile}
            copied={copied === configFile}
            onCopy={() => void copy(configFile)}
          />
        ) : null}
        {dataDir ? (
          <PathRow
            label="Data folder"
            hint="SQLite database, agent metrics and caches"
            value={dataDir}
            copied={copied === dataDir}
            onCopy={() => void copy(dataDir)}
          />
        ) : null}

        <p className="text-subtle text-xs leading-relaxed">
          Edit <code>opsora.env</code> to connect GitHub, Pi-hole, alerts or
          Calendar, then restart the app for the changes to apply.
        </p>
      </CardContent>
    </Card>
  );
}

function PathRow({
  label,
  hint,
  value,
  copied,
  onCopy,
}: {
  label: string;
  hint: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="border-border/60 bg-surface/30 flex items-center gap-3 rounded-xl border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium">{label}</p>
        <p className="text-subtle metrics truncate text-[11px]" title={value}>
          {value}
        </p>
        <p className="text-subtle truncate text-[10px]">{hint}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onCopy}
        aria-label={`Copy ${label} path`}
        title={`Copy ${label} path`}
      >
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  );
}

function AboutCard({
  liveCount,
  totalSources,
  version,
}: {
  liveCount: number;
  totalSources: number;
  version?: string;
}) {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-x-8 gap-y-2 pt-3.5 text-xs sm:grid-cols-3">
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start sm:gap-0.5">
          <span className="text-subtle">Version</span>
          <span className="metrics text-[13px] font-medium">
            {version ?? "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start sm:gap-0.5">
          <span className="text-subtle">Framework</span>
          <span className="text-[13px] font-medium">Next.js · React · Tailwind</span>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start sm:gap-0.5">
          <span className="text-subtle">Data</span>
          <span className="text-[13px] font-medium">
            {liveCount > 0
              ? `${liveCount} of ${totalSources} sources live`
              : "No sources configured"}
          </span>
        </div>
        <p className="text-subtle col-span-1 mt-2 leading-relaxed sm:col-span-3">
          Opsora is a self-hosted personal command center: what needs your
          attention now, from life and infrastructure in one place.
        </p>
      </CardContent>
    </Card>
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
        <p className="text-muted text-xs leading-relaxed">
          Opsora watches the attention feed and sends a browser notification when
          a new critical or warning signal appears while the dashboard is in the
          background.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void enable()}
            disabled={!supported || permission === "granted"}
          >
            <BellRing />
            {permission === "granted" ? "Notifications on" : "Enable notifications"}
          </Button>
          {permission === "granted" ? (
            <Button variant="secondary" size="sm" onClick={test}>
              <Send />
              Send test
            </Button>
          ) : null}
        </div>
        {permission === "denied" ? (
          <p className="text-danger text-xs">
            Blocked in the browser. Re-allow notifications in your site settings,
            then reload.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function KeyboardShortcutsCard() {
  return (
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
  );
}
