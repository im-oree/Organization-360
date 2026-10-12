# Rules

Must read before any work in this repo. New rules get added here as they come up.

## Git
- Commit messages never include a `Co-Authored-By` line or any AI attribution. PR descriptions don't either.

## Interface
- Apple-grade design and motion. No clutter, no filler or explanatory copy that isn't needed.
- Components use design tokens only. No hard-coded colors, fonts or radii outside `packages/tokens`.
- Branding (name, logo, colors, fonts) lives only in `config/brand`.

## Architecture
- Every state change is a command in `packages/contracts`, run through `POST /api/commands`.
- Every cross-module signal is an event in the event catalogue. Modules never import each other.
- Keep dependencies few and light. Avoid required third-party services.
- New apps go in `modules/<name>` with a manifest; see `docs/PLAN.md`.
