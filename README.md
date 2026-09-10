# ◈ Opsora

**A personal command center — what needs your attention now, in one place.**

Opsora is a self-hosted dashboard that answers one question: _what should I care
about right now?_ It pulls life (todos, calendar) and infrastructure (Linux
servers, Pi-hole, Docker, GitHub) into a single ranked attention feed instead of
a wall of charts.

> **Status: v0.2** — every module is fully interactive. Sources run on realistic
> mock data until you configure a real integration, then switch to live
> automatically. The UI never changes; only the server-side adapter does.

---

## What's included

| Area         | Included                                                                             |
| ------------ | ------------------------------------------------------------------------------------ |
| **Home**     | Attention feed, today's todos, today's schedule, infrastructure strip, activity       |
| **Todos**    | CRUD, statuses, priorities, projects, tags, smart views, quick add, local persistence |
| **Calendar** | Seven-day agenda with today highlighting                                             |
| **GitHub**   | Repos, PRs, issues, CI status, activity — **live with `GITHUB_TOKEN`**               |
| **Servers**  | CPU/RAM/disk/network, services, processes, history — **live via the agent**          |
| **Pi-hole**  | 24h queries/blocks, top clients and domains — **live with `PIHOLE_URL`**             |
| **Docker**   | Container table, health, CPU/memory, uptime — **live automatically from the socket** |
| **Alerts**   | Every signal, filtered by severity + browser notifications                           |
| **Analytics**| Rule-based insights generated across all sources                                     |
| **Command bar** | `⌘K` palette and single-key navigation (`N T C G D S P A`)                        |

## Live sources

Copy `.env.example` to `.env.local` and configure what you have. Anything left
unset keeps using mock data, so the dashboard is never blank.

### Docker — automatic

If `/var/run/docker.sock` exists, Docker data is live. Opt out with
`OPSORA_DOCKER=mock`.

### Linux servers — run the agent

The agent is a single dependency-free Node script:

```bash
OPSORA_URL=http://localhost:3000 \
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
Environment=OPSORA_URL=http://localhost:3000
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

## Stack

- **Next.js (App Router) + React + TypeScript**
- **Tailwind v4** with design tokens as CSS variables
- **shadcn-style copy-in primitives** (Radix only where behavior requires it)
- **TanStack Query** for polling with stale/error states
- **Zustand** for UI state and todo persistence
- **Recharts** for the two large charts, hand-rolled SVG sparklines everywhere else

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional: configure live sources
pnpm dev                     # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build (standalone output)
pnpm start        # run the production server
pnpm test         # vitest — attention rules, adapter mappings (22 tests)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

### Self-host with Docker

```bash
docker compose up -d --build
```

The image builds a Next.js standalone server and runs as a non-root user. Ingested
agent metrics persist in the `opsora-data` volume. Uncomment the socket mount in
`docker-compose.yml` to monitor the host's containers.

## Architecture

```text
                     ┌──────────────── agent (Linux) ────────────────┐
                     │  /proc, df, ps, systemctl  →  POST /api/agent │
                     └───────────────────────┬───────────────────────┘
                                             ▼
Browser ── TanStack Query (30–120s) ──► /api/snapshot + /api/sources/[source]
                                             │
                                  Adapter registry (server-side)
                                             │
        ┌────────────┬────────────┬──────────┴─────────┬────────────┐
     servers       github       pihole       docker      calendar
   agent store   REST + PAT   v6 API+sid   socket API   mock (OAuth later)
        └────────────┴────────────┴────────────────────┴────────────┘
                                             │
                                   attention engine (pure)
                                             │
                              Home · Alerts · Analytics · topbar
```

Two ideas hold the app together:

**1. Adapters.** Every source implements the same interface
(`src/lib/adapters/types.ts`) behind a registry that picks a live or mock
implementation per request. Tokens stay on the server; the UI only sees the
normalized snapshot shape.

**2. The attention engine.** A pure, unit-tested module
(`src/lib/attention/engine.ts`) converts every snapshot into one ranked list of
`AttentionItem`s. Severity, urgency and recency feed a single score, and Home,
Alerts and the topbar all read from that one list — no duplicated alert logic.

## Project structure

```text
agent/opsora-agent.mjs      # dependency-free Linux metrics agent
src/
  app/
    (dashboard)/            # shell + pages
    api/snapshot/           # all sources in one payload
    api/sources/[source]/   # one source at a time
    api/agent/              # metric ingest for the agent
  components/
    shell/                  # sidebar, topbar, command palette
    ui/                     # copy-in primitives
    viz/                    # stat tiles, sparklines, meters, rings, charts
  features/                 # home, todos, github, servers, alerts, analytics…
  lib/
    adapters/               # registry, mocks, live adapters, agent store
    attention/              # rules, scoring, types, tests
    mock/                   # realistic fixtures
  stores/                   # Zustand UI state
```

## Roadmap

- [x] v0.1 — shell, todos, attention engine, mock sources, all pages
- [x] v0.2 — live Docker + agent ingest + GitHub + Pi-hole adapters, notifications
- [ ] v0.3 — SSE for real-time metrics, SQLite for todos, source health panel
- [ ] v0.4 — Google Calendar OAuth, Telegram/Discord notifications
- [ ] v0.5 — AI daily summaries over the attention feed

## Design

Dark, dense, premium command-center UI: `#09090B` background, `#111113` panels,
`#27272A` borders, monospace metrics with tabular numerals, status colors that
never rely on hue alone.

---

Built for one user: Surya. Name **Opsora** — operations + aura.
