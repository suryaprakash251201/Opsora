# ◈ Opsora

[![CI](https://github.com/suryaprakash251201/Opsora/actions/workflows/ci.yml/badge.svg)](https://github.com/suryaprakash251201/Opsora/actions/workflows/ci.yml)
[![Release](https://github.com/suryaprakash251201/Opsora/actions/workflows/release.yml/badge.svg)](https://github.com/suryaprakash251201/Opsora/actions/workflows/release.yml)
[![Latest release](https://img.shields.io/github/v/release/suryaprakash251201/Opsora?sort=semver)](https://github.com/suryaprakash251201/Opsora/releases)
[![Docker image](https://img.shields.io/badge/image-ghcr.io-2088FF?logo=docker&logoColor=white)](https://ghcr.io/suryaprakash251201/opsora)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**A personal command center — what needs your attention now, in one place.**

Opsora is a self-hosted dashboard that answers one question: _what should I care
about right now?_ It pulls life (todos, calendar) and infrastructure (Linux
servers, Pi-hole, Docker, GitHub) into a single ranked attention feed instead of
a wall of charts.

> **Status: v0.5** — every module is fully interactive and runs on **real data
> only**: unconfigured sources show an honest "not configured" state instead of
> mock numbers. Metrics stream over SSE, tasks sync to SQLite on the server,
> and the server pushes alerts to Telegram/Discord. A failed live source shows
> a visible error state instead of breaking the page.

---

## What's included

| Area         | Included                                                                             |
| ------------ | ------------------------------------------------------------------------------------ |
| **Home**     | Attention feed, today's todos, today's schedule, infrastructure strip, activity       |
| **Todos**    | CRUD, statuses, priorities, projects, tags, smart views, quick add, **SQLite sync** |
| **Calendar** | Seven-day agenda with today highlighting                                             |
| **GitHub**   | Repos, PRs, issues, CI status, activity — **live with `GITHUB_TOKEN`**               |
| **Servers**  | CPU/RAM/disk/network, services, processes, history — **live via the agent**          |
| **Pi-hole**  | 24h queries/blocks, top clients and domains — **live with `PIHOLE_URL`**             |
| **Docker**   | Container table, health, CPU/memory, uptime — **live automatically from the socket** |
| **Alerts**   | Every signal, filtered by severity + browser and **Telegram/Discord** delivery     |
| **Analytics**| Rule-based insights generated across all sources                                     |
| **Live**     | SSE stream pushes updates every 5s; polling is the fallback                          |
| **Command bar** | `⌘K` palette and single-key navigation (`N T C G D S P A`)                        |

## Live sources

Copy `.env.example` to `.env.local` and configure what you have. Anything left
unset renders a "not configured" empty state with setup hints — the dashboard
never invents data.

### Docker — automatic

If `/var/run/docker.sock` exists, Docker data is live. Opt out with
`OPSORA_DOCKER=0`.

### Linux servers — run the agent

The agent is a single dependency-free Node script:

```bash
OPSORA_URL=http://localhost:9942 \
OPSORA_ROLE="Primary homelab server" \
OPSORA_SERVICES=docker,ssh,caddy \
node agent/opsora-agent.mjs
```

- `--once` sends a single report; otherwise it loops (`OPSORA_INTERVAL`, default 30s).
- Metrics: CPU, memory, disks, network throughput, load, temperature, top
  processes and systemd service states.
- Set `OPSORA_AGENT_TOKEN` on the server and `OPSORA_TOKEN` on the agent to
  require a shared secret.

Minimal systemd unit:

```ini
[Unit]
Description=Opsora agent
After=network-online.target

[Service]
Environment=OPSORA_URL=http://localhost:9942
Environment=OPSORA_ROLE=Primary homelab server
ExecStart=/usr/bin/node /opt/opsora/agent/opsora-agent.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

### GitHub — personal access token

```bash
GITHUB_TOKEN=github_pat_...
```

Read-only access is enough. Repos, latest commits, Actions runs, review-requested
and authored PRs, plus open issues.

### Pi-hole — v6 API

```bash
PIHOLE_URL=http://pi.hole
PIHOLE_PASSWORD=...
```

### Google Calendar — OAuth

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_CALENDAR_ID=primary   # optional
```

Create an OAuth client of type "Desktop app" in Google Cloud, then let the
helper script walk you through consent and print the refresh token:

```bash
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-oauth.mjs
```

### Telegram / Discord alerts

```bash
TELEGRAM_BOT_TOKEN=...   # from @BotFather
TELEGRAM_CHAT_ID=...
DISCORD_WEBHOOK_URL=...
```

When configured, the server checks the attention feed every minute and pushes
new critical/warning signals (set `OPSORA_ALERT_LEVEL=all` to include info,
`OPSORA_ALERTS=0` to disable). The first run only records the current state, so
you never get a startup flood. Use the "Send test" button in Settings to verify
a channel.

## Stack

- **Next.js (App Router) + React + TypeScript**
- **Tailwind v4** with design tokens as CSS variables
- **shadcn-style copy-in primitives** (Radix only where behavior requires it)
- **TanStack Query** for polling with stale/error states
- **Zustand** for UI state and todo persistence
- **Recharts** for the two large charts, hand-rolled SVG sparklines everywhere else
- **Tauri v2 (Rust)** for the native desktop shell (`src-tauri/`)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional: configure live sources
pnpm dev                     # http://localhost:9942
```

Other scripts:

```bash
pnpm build        # production build (standalone output)
pnpm start        # run the production server
pnpm test         # vitest — attention, adapters, calendar, alerts, SQLite (43 tests)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

### Desktop app (Tauri)

The same dashboard as a native window. The packaged app bundles the Next.js
standalone server **and a Node.js 22 runtime**, so end users do not need
Node.js installed — it boots the server on launch, shows a themed splash
while it warms up, then opens the dashboard.

Prerequisites for building: Rust + WebKit dev libraries. Running from source
only requires Node.js for the dev server; `pnpm desktop:stage` downloads the
bundled runtime automatically (cached in `.node-runtime/`).

```bash
pnpm desktop:dev      # Tauri window + Next dev server (http://localhost:9942)
pnpm desktop:runtime  # pre-download the Node binary that gets bundled
pnpm desktop:stage    # Next production build → stage server + runtime + public/
pnpm desktop:build    # produce native installers (AppImage/deb/rpm, NSIS/MSI)
```

How it works:

- `scripts/desktop-stage.mjs` (runs as Tauri's `beforeBuildCommand`)
  production-builds Next.js and stages the standalone server, static assets
  and the Node runtime into `src-tauri/bundled-server/`.
- `src-tauri/src/main.rs` picks a free port (`OPSORA_PORT` overrides,
  default `9942`, random fallback when the port is taken by something that
  is not Opsora), spawns the bundled server with the bundled Node, waits for
  it to answer, then swaps the splash page for the dashboard.
- External links open in the system browser; the app window stays on the
  local server. A second launch focuses the existing window instead of
  starting a rival server.
- Config lives in the OS app-data directory: `opsora.env` (tokens,
  `PIHOLE_URL`, …) is written with a commented template on first launch and
  injected into the server process. Server data (SQLite, agent metrics)
  lives next to it in `server-data/`, so updates never wipe tasks.

### Self-host with Docker

Pull the prebuilt image (CI publishes it on every release tag):

```bash
docker run -d \
  --name opsora \
  -p 9942:9942 \
  --env-file .env \
  --group-add "$(stat -c '%g' /var/run/docker.sock)" \
  -v opsora-data:/app/.data \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  ghcr.io/suryaprakash251201/opsora:latest
```

- `--env-file .env` passes your `GITHUB_TOKEN` / `PIHOLE_URL` / … into the
  container. Without it every source renders a "not configured" empty state.
- The socket mount plus `--group-add` is what makes the Docker page live. The
  image runs as a non-root user, so it needs the host's docker group GID to
  read `/var/run/docker.sock`.

Or build and run from source:

```bash
cp .env.example .env   # fill in what you have
docker compose up -d --build
```

The image builds a Next.js standalone server and runs as a non-root user. Ingested
agent metrics persist in the `opsora-data` volume. `docker-compose.yml` already
mounts the host socket and loads `.env`; set `DOCKER_GID` if your host docker
GID is not `983` (`stat -c '%g' /var/run/docker.sock`).

## CI/CD

| Workflow | Trigger | What it does |
| -------- | ------- | ------------ |
| **CI** (`.github/workflows/ci.yml`) | push to `main`, PRs | lint → typecheck → test → production build → Tauri shell (fmt/check/clippy) |
| **Desktop** (`.github/workflows/desktop.yml`) | manual, or called by Release | build self-contained Tauri installers on `ubuntu-22.04` (AppImage/deb/rpm) and `windows-latest` (NSIS/MSI), upload them as artifacts |
| **Release** (`.github/workflows/release.yml`) | tag `v*` | verify → Docker image + desktop installers → GitHub release with all assets attached |

To cut a release:

```bash
git tag v0.6.0 && git push origin v0.6.0
```

## Architecture

```text
                     ┌──────────────── agent (Linux) ────────────────┐
                     │  /proc, df, ps, systemctl  →  POST /api/agent │
                     └───────────────────────┬───────────────────────┘
                                             ▼
Browser ── SSE /api/stream (5s) ──┐
   │                              ├──► /api/snapshot + /api/sources/[source]
   └── TanStack Query (fallback) ─┘             │
                                     Adapter registry (server-side)
                                                │
Browser ◄── /api/todos ◄── SQLite (.data/opsora.db)

Server startup ── instrumentation ──► alert dispatcher (60s)
                                        └──► Telegram · Discord
                                             │
        ┌────────────┬────────────┬──────────┴─────────┬────────────┐
     servers       github       pihole       docker      calendar
   agent store   REST + PAT   v6 API+sid   socket API   OAuth refresh
        └────────────┴────────────┴────────────────────┴────────────┘
                                             │
                                   attention engine (pure)
                                             │
                              Home · Alerts · Analytics · topbar
```

Two ideas hold the app together:

**1. Adapters.** Every source implements the same interface
(`src/lib/adapters/types.ts`) behind a registry that resolves the live
adapter when credentials/data exist, or an honest empty state otherwise.
There is no mock data path. Tokens stay on the server; the UI only sees the
normalized snapshot shape.

**2. The attention engine.** A pure, unit-tested module
(`src/lib/attention/engine.ts`) converts every snapshot into one ranked list of
`AttentionItem`s. Severity, urgency and recency feed a single score, and Home,
Alerts and the topbar all read from that one list — no duplicated alert logic.

## Project structure

```text
agent/opsora-agent.mjs      # dependency-free Linux metrics agent
scripts/desktop-stage.mjs   # stages standalone server + Node runtime for Tauri
scripts/fetch-node-runtime.mjs # downloads the pinned Node binary to bundle
src-tauri/                  # Tauri v2 desktop shell (Rust + splash + config)
src-tauri/splash/           # loading / error page shown while the server boots
src/
  app/
    (dashboard)/            # shell + pages
    api/snapshot/           # all sources in one payload
    api/sources/[source]/   # one source at a time
    api/agent/              # metric ingest for the agent
  components/
    shell/                  # sidebar, topbar, command palette, circuit bg
    icons/                  # animated "live" SVG icon system
    ui/                     # copy-in primitives
    viz/                    # stat tiles, sparklines, meters, rings, charts
  features/                 # home, todos, github, servers, alerts, analytics…
  lib/
    adapters/               # registry, live adapters, agent store
    attention/              # rules, scoring, types, tests
    activity.ts             # activity feed derived from real snapshots
    types/                  # shared snapshot shapes (servers, github, …)
  stores/                   # Zustand UI state (theme, sidebar, sync…)
```

## Roadmap

- [x] v0.1 — shell, todos, attention engine, all pages
- [x] v0.2 — live Docker + agent ingest + GitHub + Pi-hole adapters, notifications
- [x] v0.3 — SSE live stream, SQLite task sync, source health panel
- [x] v0.4 — Google Calendar OAuth, Telegram/Discord delivery, empty states
- [x] v0.5 — theme system fix, circuit background, live icons, real-data-only, Tauri desktop
- [x] v0.6 — self-contained desktop installers (bundled Node), Windows/Linux builds in CI, splash + single-instance shell, command-palette task search
- [ ] next — AI daily summaries over the attention feed

## Design

Dark, dense, premium command-center UI: `#09090B` background, `#111113` panels,
`#27272A` borders, monospace metrics with tabular numerals, status colors that
never rely on hue alone.

---

Built for one user: Surya. Name **Opsora** — operations + aura.
