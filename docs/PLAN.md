# Organization 360 — Build Plan

One platform, many apps, one shared system. Every app is a plug-in module on a common foundation, so a change made once (brand, tokens, a component, a contract) shows up everywhere.

## Principles

1. **Change once, update everywhere.** Brand, theme, components, data contracts and events each live in exactly one package.
2. **Plug and play.** A module is a folder with a manifest. Add it to the registry and it appears in navigation, routing and search. Delete it and nothing else breaks.
3. **Split-ready.** Modules talk through contracts and events, never by importing each other. Any module's backend can move to its own service without frontend changes.
4. **Runs anywhere.** Web first, then desktop (Tauri) and mobile (Capacitor or React Native) from the same packages. The gateway runs on Node, Bun, Docker or edge runtimes.
. **Automation-ready by construction.** Every state change is a typed command run through one endpoint, validated, idempotent and logged. A click, a script, an automation rule and an AI agent all call the same command, so anything a person does can be automated reliably.
7. **Light and self-reliant.** Few dependencies, no required third-party services. The bus, store and runner work in-process today and swap to NATS and Postgres through adapters.

## Repository layout

```
apps/shell            Web app that hosts every module (React, TS, Tailwind, Motion)
packages/tokens       Design tokens → CSS variables. Single source of visual truth
packages/ui           Shared components built only on tokens
packages/contracts    Zod schemas + event catalogue shared by frontends and backends
packages/platform     Frontend runtime: module registry, API client, live events, theming
modules/<name>        One folder per app (home, people, …). Each exports a manifest
services/gateway      API gateway + event bus. Mounts each module's routes
config/brand          Swappable brand: name, logo, colors, fonts
docs                  Plans and decisions
```

## How things connect

- **Contracts.** Every entity and event is a Zod schema in `@o360/contracts`. Frontend and backend import the same types, so a field change fails the build wherever it matters.
- **Events.** Backends publish typed events (`people.member.created`). The gateway fans them out over Server-Sent Events. Any module can react: a new hire can trigger ID issuance, payroll records and onboarding tasks without the People module knowing those exist.
- **Bus abstraction.** Today the bus is in-process. Swapping to NATS or Redis Streams is one adapter, which is the step that lets modules become separate services.
- **Brand at runtime.** The gateway serves `/api/brand`. The shell applies it as CSS variables, so a tenant rebrand needs no rebuild.

## Hosting path

| Stage | Where | How |
|---|---|---|
| Now | This machine | `pnpm dev` — shell on :5173, gateway on :4000 |
| Share a preview | Public URL from this machine | `pnpm build && pnpm start`, then `cloudflared tunnel --url http://localhost:4000` |
| Pilot | One rented dedicated server or VPS | Docker Compose: gateway, Postgres, NATS, object storage, Caddy for TLS |
| Production | Dedicated servers or colocation, multi-node | Kubernetes or Nomad, per-module services, GPU node for AI |
| Customer self-host | Their servers | Same images, one-command installer, signed licence |

## Phases

### Phase 0 — Foundation (in progress)
- [x] Monorepo, shared TS config, workspace packages
- [x] Token-based theming with light/dark and runtime brand swap
- [x] Shared UI kit with Motion animations
- [x] Module manifest + registry; shell auto-builds nav and routes
- [x] Gateway with module route mounting and live event stream
- [x] Two reference modules: Home, People (end-to-end with events)
- [x] Command runner (validation, idempotency keys, run log) and event→command automation rules
- [ ] Postgres via Drizzle, migrations, seed data
- [ ] Auth: OIDC (self-hosted Zitadel or Keycloak), sessions, roles
- [ ] Tenancy: tenant id on every row, per-tenant brand
- [ ] Docker Compose + CI (typecheck, test, build)

### Phase 1 — Identity and People
Directory, org chart, roles, onboarding/offboarding flows, digital staff ID with QR, audit log, admin console with branding editor.

### Phase 2 — Communication
Calendar (CalDAV), chat and channels, meetings (LiveKit for WebRTC), mail (Stalwart for SMTP/IMAP/JMAP, our UI on top).

### Phase 3 — Work
Files (S3-compatible storage, versioning), docs/sheets/slides (evaluate OnlyOffice or Collabora vs. own editors on Yjs), tasks and projects, forms, whiteboard.

### Phase 4 — Operations
Payroll, payments and billing, finance, KPIs and OKRs, analytics and BI, CRM, assets, workflow builder.

### Phase 5 — AI layer
Model gateway (vLLM/Ollama behind one API), permission-aware RAG over every module, agents that act through the same APIs, feedback capture and eval gates, meeting intelligence, site review, design automation.

### Phase 6 — Productize
Multi-tenant billing, reseller hierarchy, custom domains, self-host installer, desktop and mobile clients, certifications.

## Adding a module

1. Copy `modules/people` to `modules/<name>` and rename.
2. Edit its `manifest.ts`: id, title, icon, path.
3. Add schemas and events to `packages/contracts`.
4. Add its server routes in `modules/<name>/src/server.ts` and register them in `services/gateway/src/modules.ts`.
5. Register the manifest in `apps/shell/src/modules.ts`.

## Rebranding

Edit `config/brand/brand.json` and replace `config/brand/logo.svg`. Reload. No code changes.
