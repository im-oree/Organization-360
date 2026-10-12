# Rules

Must read before any work in this repo, along with `docs/STANDARD.md` and `docs/UX.md`. New rules get added here as they come up.

## Git
- Commit messages never include a `Co-Authored-By` line or any AI attribution. PR descriptions don't either.

## User-friendliness (top priority)
- Follow `docs/UX.md` on every screen.
- Every error is plain English: what happened and what to do next. Never blame the person, never show codes or jargon.
- Nothing fails silently. Use `useAction`, `notify`, `confirm`, `<Field error>` and `<LoadError>`; never hand-roll alerts.

## Naming
- Never use another company's names or branding in product, code or docs. External projects are reference only, used sparingly.

## Interface
- Backoffice design: navy primary, sidebar + breadcrumb shell, clean cards. Motion is quick and purposeful.
- No clutter, no filler copy.
- Working systems before polish.
- Components use design tokens only. No hard-coded colors, fonts or radii outside `packages/tokens`.
- Branding (name, logo, colors, fonts) lives only in `config/brand`.

## Access
- Every command and every read route is permission-checked on the server. Permission keys are `<app>.<resource>.<action>`; a command's name is its key.
- Fail closed: no permission, no access. No empty-means-all shortcuts.

## Architecture
- Every state change is a command in `packages/contracts`, run through `POST /api/commands`.
- Every cross-module signal is an event in the event catalogue. Modules never import each other.
- Keep dependencies few and light. Avoid required third-party services.
- New apps go in `modules/<name>` with a manifest; see `docs/PLAN.md`.
