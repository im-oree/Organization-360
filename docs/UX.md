# UX Standard

User-friendliness is the top priority. Every screen is checked against this list before it ships.

## Errors and feedback (non-negotiable)
- Every error says, in plain English, what happened and what to do next. No codes, no jargon, no blaming the person.
  - Good: "Someone already uses that email address. Try a different one."
  - Bad: "409 Conflict", "Invalid input", "You entered a wrong email".
- Nothing fails silently. Every action a person triggers ends in visible feedback: a success note, an inline field message, or an error note.
- Use the shared systems, never one-offs:
  - `notify.success | error | warning | info` for notifications, with an optional action such as Undo.
  - `useAction` to run anything async: it handles busy state, field errors and notifications.
  - `confirm()` only for irreversible actions. Prefer Undo for reversible ones.
  - `<Field error>` for inline validation, announced to screen readers.
  - `<LoadError retry>` wherever data can fail to load.
- Server messages come from `friendlyIssues` (validation) or a `CommandError` with a plain sentence. The client never invents technical wording.
- A global catch turns any unhandled failure into a notification.

## Cognitive load
- Fewest choices possible (Hick). One primary action per screen.
- Group into chunks of 5–7 (Miller). Navigation sections stay short.
- Behave like tools people know (Jakob): sidebar, breadcrumb, search, tables.
- Optimise the 20% of features used 80% of the time (Pareto).
- Absorb complexity in the system, not the user (Tesler): sensible defaults, automations, prefilled fields.
- Show progress for unfinished work (Zeigarnik): open-task counts, onboarding progress.
- End flows well (Peak-End): clear confirmation that the job is done.

## Navigation
- Always show where you are: active sidebar item, breadcrumb, page title.
- Logo goes Home. Core pages within 3 clicks.
- Primary navigation visible on desktop; drawer only on small screens.
- Every modal and sub-flow has a clear way out (Cancel, Escape, backdrop).

## Layout and copy
- Design for scanning: strong headings, short lines, generous space, 8pt rhythm.
- Paragraphs under 3–4 lines. Headings describe the content below them.
- Buttons say what they do: "Add person", "Save role", never "OK" or "Submit".
- Primary (filled), secondary (soft), tertiary (outline/ghost) are visually distinct.
- Colour never carries meaning alone: chips pair colour with words, icons have labels.
- Contrast meets WCAG AA.

## Forms
- Single column, labels above inputs, no floating labels.
- Mark optional fields, not required ones.
- Inline validation with a specific fix for each field.
- Input width matches expected length; correct mobile keyboard types (`type="email"`, `inputmode`).
- Don't ask for anything not needed right now.
- Keep what the person typed when something fails.

## States
- Every view defines: loading, empty, error, partial, ideal.
- Empty states say what to do next in one line.
- Show a loading indicator for waits over one second; prefer optimistic updates when safe.
- Disabled controls look disabled and explain why when it isn't obvious.

## Accessibility
- Full keyboard use; visible focus ring; skip link.
- Native elements (`button`, `a`, `input`, `nav`, `table`).
- Touch targets at least 44×44 px on mobile.
- Respect `prefers-reduced-motion` and the light/dark preference.
- Alerts use `role="alert"` / `aria-live`.

## Mobile
- Mobile-first layouts, no horizontal scroll except data tables.
- Primary actions within thumb reach; enough spacing to avoid mis-taps.

## Process
- Test with real users early; watch behaviour over opinion.
- Measure: adoption per module, task completion time, error rates.
- Usability beats novelty.
