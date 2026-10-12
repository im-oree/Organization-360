# Apps

Build order, and for each app: what we copy from suites, where we go further, and how it connects.

## Build order

| # | App | Why this position |
|---|---|---|
| 1 | **Identity & Backoffice** | Everything depends on it: login, roles, staff records, app registry, audit. Proven design from the previous backoffice. |
| 2 | **StaffDesk (People & Digital ID)** | First real value. Staff directory, org chart, onboarding, digital ID cards. Already familiar to staff. |
| 3 | **Tasks & Projects** | Small, daily-use, and the landing spot for automations from every other app. |
| 4 | **Calendar & Meetings** | Highest daily usage after chat. LiveKit handles media; we own scheduling, notes and actions. |
| 5 | **Chat** | Retires Teams/Slack seats. Builds on identity and events. |
| 6 | **Files & Docs** | Storage first, then co-editing (evaluate OnlyOffice/Collabora vs Yjs editors). |
| 7 | **KPI & Analytics** | Feeds on data from 2–6. |
| 8 | **Payroll & Payments** | High stakes; needs stable People data and parallel-run testing. |
| 9 | **Mail** | Hardest operationally (deliverability). Stalwart server, our client. |
| 10 | **AI layer** | Grows across all phases; becomes a visible app once there is data to work over. |

## 1. Identity & Backoffice
- **Parity:** sign-in, password reset, MFA, sessions, users, roles, groups, audit log, admin console (Entra ID, Google Admin).
- **Better:** one role editor covering every app; permission keys that match command names, so access is predictable; live audit stream; per-tenant branding from the same screen.
- **Emits:** `identity.user.created`, `identity.user.suspended`, `identity.role.changed`.
- **Connectors:** OIDC provider for external apps (Phase 2), SCIM for HR systems, LDAP bridge.

## 2. StaffDesk (People & Digital ID)
- **Parity:** directory, profiles, org chart, departments, onboarding/offboarding checklists (Workday, Zoho People).
- **Better:** onboarding is a rule chain: create member → account → ID card → payroll record → tasks → welcome message, all visible and editable in Automations. Offboarding revokes everything in one command. Digital ID with QR verification page.
- **Emits:** `people.member.created|updated|removed`, `people.member.onboarded`.
- **Connectors:** CSV/Excel import, vCard export, door-access webhook.

## 3. Tasks & Projects
- **Parity:** lists, boards, due dates, assignees, comments (Planner, Asana).
- **Better:** tasks created by any app link back to their source (the meeting, the email, the approval). "My day" merges tasks, meetings and approvals in one view.
- **Emits:** `tasks.task.created|updated|completed`.

## 4. Calendar & Meetings
- **Parity:** calendars, free/busy, rooms, booking pages, video, screen share, recording, transcripts (Outlook, Teams, Zoom).
- **Better:** agenda pulls open tasks for the attendees; decisions and action items become tasks automatically; meeting cost and time-in-meetings per team shown to managers.
- **Connectors:** CalDAV, iCal feeds, Google/Microsoft calendar sync during migration.

## 5. Chat
- **Parity:** DMs, channels, threads, reactions, files, huddles.
- **Better:** any event can post to a channel through a rule; slash commands run platform commands; message → task in one action.

## 6. Files & Docs
- **Parity:** storage, sharing, versions, Word/Excel/PowerPoint editing and import/export.
- **Better:** documents bound to live data (a sheet range pulling KPIs, a doc template filled from a staff record); every file searchable by the AI layer with permissions respected.

## 7. KPI & Analytics
- **Parity:** dashboards, reports, OKRs (Power BI, Zoho Analytics).
- **Better:** metrics computed from platform events, no export pipelines; ask questions in plain language.

## 8. Payroll & Payments
- **Parity:** salary structures, tax rules, payslips, payouts, invoices.
- **Better:** payroll reads attendance, leave and KPI data directly; anomaly checks before every run.

## 9. Mail
- **Parity:** own domain mail, rules, shared mailboxes, search.
- **Better:** mail → task, mail → ticket, AI triage over our own models.

## Connectors

The connector system is how the platform reaches anything outside it:

- **Inbound webhooks:** an external system calls `POST /api/hooks/<id>`; a mapping turns the payload into a command.
- **Outbound webhooks:** any event can be forwarded to a URL with retries and signing.
- **Polling connectors:** scheduled pulls from external APIs, mapped to commands.
- **Protocol bridges:** CalDAV, IMAP/SMTP, SCIM, OIDC, S3. Standards first, custom second.

All four use the same command and event catalogue, so a connector is configuration, not new code.
