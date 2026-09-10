# ◈ Opsora

**A personal command center — what needs your attention now, in one place.**

Opsora is a self-hosted dashboard that answers one question: _what should I care
about right now?_ It pulls life (todos, calendar) and infrastructure (Linux
servers, Pi-hole, Docker, GitHub) into a single ranked attention feed instead of
a wall of charts.

> **Status: v0.1** — every module is fully interactive and driven by realistic
> mock adapters. Wiring real sources is a server-side, one-file change per
> source; the UI does not change.

---

## What's in v0.1

| Area              | Included                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| **Home**          | Attention feed, today's todos, today's schedule, infrastructure strip, activity |
| **Todos**         | CRUD, statuses, priorities, projects, tags, smart views, quick add, local persistence |
| **Calendar**      | Seven-day agenda with today highlighting                                  |
| **GitHub**        | Repos, PRs, issues, CI/deploy status, activity                            |
| **Servers**       | Per-machine CPU/RAM/disk/network, services, top processes, 48-sample history |
| **Pi-hole**       | 24h query/block chart, top clients, blocked and allowed domains, upstream health |
| **Docker**        | Container table with state, health, CPU/memory, uptime and restarts       |
| **Alerts**        | Every signal, filtered by severity                                        |
| **Analytics**     | Rule-based insights generated across all sources                          |
| **Command bar**   | `⌘K` palette and single-key navigation (`N T C G D S P A`)                |

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
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build (standalone output)
pnpm start        # run the production server
pnpm test         # vitest — attention engine rules and scoring
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

### Self-host with Docker

```bash
docker compose up -d --build
```

The image builds a Next.js standalone server and runs as a non-root user.

## Architecture

```text
Browser ── TanStack Query (30–120s polling) ──► /api/snapshot
                                             └► /api/sources/[source]
                                                        │
                                             SourceAdapter (server-side)
                                                        │
                              ┌────────────┬────────────┼────────────┬────────────┐
                           servers       github       pihole       docker      calendar
                           (mock)        (mock)       (mock)       (mock)       (mock)
```

Two ideas hold the app together:

**1. Adapters.** Every data source implements the same interface
(`src/lib/adapters/types.ts`) and is served through two route handlers. When a
real API is wired in, its token stays on the server and the response shape is
all the UI ever sees.

**2. The attention engine.** A pure, unit-tested module
(`src/lib/attention/engine.ts`) converts every snapshot into one ranked list of
`AttentionItem`s. Severity, urgency and recency feed a single score, and Home,
Alerts and the topbar all read from that one list — no duplicated alert logic.

## Project structure

```text
src/
  app/
    (dashboard)/            # shell + pages (Home, Todos, GitHub, Servers, …)
    api/snapshot/           # all sources in one payload
    api/sources/[source]/   # one source at a time
  components/
    shell/                  # sidebar, topbar, command palette
    ui/                     # copy-in primitives
    viz/                    # stat tiles, sparklines, meters, rings, charts
  features/
    home/ todos/ github/ servers/ analytics/ …
  lib/
    adapters/               # SourceAdapter interface + registry
    attention/              # rules, scoring, types, tests
    mock/                   # realistic fixtures (deterministic + lively)
  stores/                   # Zustand UI state
```

## Wiring real sources (next phase)

1. Add credentials to `.env.local` (never exposed to the browser).
2. Implement the real adapter next to the mock, e.g.
   `getSnapshot()` → Pi-hole v6 API / GitHub REST / agent ingest.
3. Flip the registry entry in `src/lib/adapters/index.ts`. Done.

Planning notes for later: SSE/WebSocket for true live metrics, SQLite for
server-side todo persistence, and unified notifications (browser, Telegram,
Discord).

## Design

Dark, dense, premium command-center UI: `#09090B` background, `#111113` panels,
`#27272A` borders, monospace metrics with tabular numerals, status colors that
never rely on hue alone.

---

Built for one user: Surya. Name **Opsora** — operations + aura.
