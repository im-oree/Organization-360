# The Standard

A living profile of what we build and how. Every decision that proves right gets written here, so each app starts where the last one finished. Read alongside `RULES.md`.

## Product

- **Working systems over decoration.** Ship the flow end to end first, then polish.
- **One place per job.** Staff use the workspace; admins use the backoffice. Same app, same login, different areas gated by permission.
- **Everything automatable.** If a person can do it in the UI, a rule, a script, a connector or an AI agent can do it through the same command.
- **Everything connected.** Apps never call each other directly. They publish events and run commands, so any app can react to any other without either knowing.
- **Beat suites on integration, not on feature count.** Microsoft and Zoho are many products glued together. We are one product with one data model. Every feature should use that: a meeting knows the attendees' tasks, a payslip knows the KPI, a new hire flows to every app automatically.

## Interface

- Backoffice layout: left sidebar (brand block, grouped navigation, user card with sign-out), breadcrumb top bar, content on a light canvas.
- Navy primary, white surfaces, light grey canvas, hairline borders, 12px card radius, soft navy-tinted shadows. All defined as tokens in `packages/tokens`.
- Motion is quick and purposeful: page fade-up, layout transitions for list changes, spring on press, shared-layout nav highlight. Respect reduced motion.
- No filler copy. Headings name things; empty states are one short line.
- Status shown as chips with fixed colour pairs (active green, pending amber, suspended red, draft grey).
- Every page works at phone width. The sidebar becomes a drawer.

## Access control

- Permissions are flat keys: `<app>.<resource>.<action>`, for example `people.member.create`.
- A command's name is its permission key. Reads use `<app>.<resource>.view`.
- Roles are named sets of keys. Wildcards are explicit: `*` or `people.*`. An empty list grants nothing. Never fail open.
- Checks run on the server for every command and route. The client only hides what the server would refuse.
- Credentials live in their own store, hashed with scrypt. No shared default passwords.
- Every command run is audited with the actor.
- Automations run as a `system` actor with full rights, and their runs are audited the same way.

## Apps and extensions (one schema)

Everything pluggable is described by data, so adding capability is configuration, not rework.

- **App:** a module declares `app: { title, permissions }` in its server half. The role editor, launcher and access checks read it from `/api/catalogue`. There is no central list to edit.
- **Extension:** an optional add-on to an app, declared as `ExtensionDef { id, app, title, summary, fields, settings, permissions }`. Admins switch it on in Apps & extensions.
  - `fields` are extra values on each record, stored at `record.ext[extensionId]`, rendered and validated generically.
  - `settings` are organization-wide values for the extension.
  - `permissions` appear in the role editor while the extension is on.
  - Switching an extension off hides it and keeps its data.
- **FieldDef** is the single field schema (text, url, email, tel, select, with hint, options, link template, max length). Forms, profile display and server validation all come from it.
- **Hardware and connectors** are extensions plus a command. Example: the Badge and NFC extension adds a tag ID field and `people.badge.scan`, which readers call with their own reader account. Every scan becomes a `people.badge.scanned` event that automations can use.
- Shipped StaffDesk extensions: LinkedIn profiles, GitHub accounts, Badge and NFC readers.

## Code

- Contracts first: add the schema, event and command to `packages/contracts`, then implement.
- Modules own their data and expose it only through routes, commands and events.
- Stores sit behind interfaces (`Collection`), buses behind `Bus`. Adapters change, call sites don't.
- Prefer platform APIs (`node:crypto`, `fetch`, `EventSource`) over libraries.

## Naming

- Our own names for everything. Other companies' products are reference material only, never names, branding or copy.
- Working names: StaffDesk for people management. Other app names are decided when we build them.

## Lessons carried over

From earlier internal projects:
- One schema for every list. Two shapes for the same data caused grants to be wiped.
- When refreshing the signed-in user, replace permission fields, never merge, so revocations take effect.
- Return 403 for forbidden actions, not 404.
- No hard-coded brand data in components.
