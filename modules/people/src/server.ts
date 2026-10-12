import type { BadgeScan, IdVerification, Member } from "@o360/contracts";
import { actorOf, CommandError, defineServerModule, extensions, fileCollection, guard, signedIn } from "@o360/server-kit";

const today = () => new Date().toISOString().slice(0, 10);

const members = fileCollection<Member>("people", [
  seed(1, "Ada Obi", "ada@example.com", "Head of Operations", "Operations", null, "active", "2024-02-01"),
  seed(2, "Tunde Bello", "tunde@example.com", "Engineering Lead", "Engineering", "s1", "active", "2023-08-14"),
  seed(3, "Kemi Adeyemi", "kemi@example.com", "Product Designer", "Design", "s1", "active", "2025-01-06"),
  seed(4, "Chidi Okafor", "chidi@example.com", "Software Engineer", "Engineering", "s2", "active", "2025-06-02"),
]);

// Bring records saved by earlier versions up to the current shape.
for (const m of members.all()) if (!m.ext) members.put({ ...m, ext: {} });

function seed(n: number, name: string, email: string, title: string, department: string, managerId: string | null, status: Member["status"], startDate: string): Member {
  return { id: `s${n}`, staffNo: staffNo(n), name, email, phone: "", title, department, location: "Lagos", managerId, status, startDate, joinedAt: `${startDate}T09:00:00.000Z`, ext: {} };
}
function staffNo(n: number) {
  return `S-${String(n).padStart(4, "0")}`;
}
const nextStaffNo = () => staffNo(Math.max(0, ...members.all().map((m) => Number(m.staffNo.slice(2)) || 0)) + 1);

function get(id: string) {
  const m = members.get(id);
  if (!m) throw new CommandError("We couldn't find that person. They may have been removed. Refresh to see the latest.", 404);
  return m;
}
function checkEmail(email: string, self?: string) {
  if (members.all().some((m) => m.id !== self && m.email.toLowerCase() === email.toLowerCase()))
    throw new CommandError("Someone in the directory already uses that email address. Try a different one.", 409);
}
/** A manager must exist, be current, and not create a loop in the reporting line. */
function checkManager(managerId: string | null | undefined, self?: string) {
  if (!managerId) return;
  let cur = members.get(managerId);
  if (!cur || cur.status === "offboarded") throw new CommandError("The chosen manager isn't in the directory anymore. Pick someone else.", 422);
  for (let i = 0; cur && i < 100; i++) {
    if (cur.id === self) throw new CommandError("That would make someone their own manager further up the line. Pick a different manager.", 422);
    cur = cur.managerId ? members.get(cur.managerId) : undefined;
  }
}

export default defineServerModule({
  id: "people",
  app: {
    title: "StaffDesk",
    permissions: [
      { key: "people.member.view", label: "View directory" },
      { key: "people.member.create", label: "Add people" },
      { key: "people.member.update", label: "Edit profiles" },
      { key: "people.member.activate", label: "Complete onboarding" },
      { key: "people.member.offboard", label: "Offboard people" },
      { key: "people.member.remove", label: "Delete records" },
    ],
  },
  extensions: [
    {
      id: "linkedin",
      app: "people",
      title: "LinkedIn profiles",
      summary: "Show each person's LinkedIn on their profile.",
      fields: [{ key: "url", label: "LinkedIn profile", type: "url", placeholder: "https://linkedin.com/in/…", linkTemplate: "{value}" }],
      settings: [],
    },
    {
      id: "github",
      app: "people",
      title: "GitHub accounts",
      summary: "Link people to their GitHub username.",
      fields: [{ key: "username", label: "GitHub username", type: "text", max: 39, linkTemplate: "https://github.com/{value}" }],
      settings: [{ key: "org", label: "GitHub organization", type: "text", hint: "Used for future team sync." }],
    },
    {
      id: "badge",
      app: "people",
      title: "Badge and NFC readers",
      summary: "Give each person a badge or NFC tag ID and let door or desk readers check it.",
      fields: [{ key: "uid", label: "Badge or NFC tag ID", type: "text", max: 64, hint: "Printed on the badge or read from the tag." }],
      settings: [{ key: "devices", label: "Reader names", type: "text", hint: "Comma-separated, for example Front door, Lab." }],
      permissions: [{ key: "people.badge.scan", label: "Check badges (for reader accounts)" }],
    },
  ],
  routes(app) {
    app.get("/people", guard("people.member.view"), (c) => c.json(members.all().sort((a, b) => a.name.localeCompare(b.name))));
    /** The signed-in person's own staff record, matched by email. Anyone signed in can see their own. */
    app.get("/people/me", signedIn, (c) => {
      const email = actorOf(c)?.email?.toLowerCase();
      return c.json(members.all().find((m) => m.email.toLowerCase() === email && m.status !== "offboarded") ?? null);
    });
    app.get("/people/:id", guard("people.member.view"), (c) => c.json(get(c.req.param("id"))));
    /** Public: what anyone scanning an ID card sees. Only current staff verify. */
    app.get("/verify/:staffNo", (c) => {
      const m = members.all().find((x) => x.staffNo === c.req.param("staffNo"));
      const body: IdVerification = m && m.status !== "offboarded" ? { valid: true, name: m.name, title: m.title, department: m.department, staffNo: m.staffNo } : { valid: false };
      return c.json(body);
    });
  },
  commands: {
    "people.member.create"(input, { bus }) {
      checkEmail(input.email);
      checkManager(input.managerId);
      const member = members.put({ ...input, ext: extensions.clean("people", input.ext), startDate: input.startDate ?? today(), id: crypto.randomUUID(), staffNo: nextStaffNo(), status: "onboarding", joinedAt: new Date().toISOString() });
      bus.publish("people.member.created", member);
      return member;
    },
    "people.member.update"({ id, ...patch }, { bus }) {
      const m = get(id);
      if (patch.email) checkEmail(patch.email, id);
      if (patch.managerId !== undefined) checkManager(patch.managerId, id);
      const next = members.put({ ...m, ...patch, ext: extensions.clean("people", patch.ext, m.ext) });
      bus.publish("people.member.updated", next);
      return next;
    },
    "people.member.activate"({ id }, { bus }) {
      const m = get(id);
      if (m.status !== "onboarding") throw new CommandError(`${m.name} has already finished onboarding.`, 409);
      const next = members.put({ ...m, status: "active" });
      bus.publish("people.member.activated", next);
      return next;
    },
    "people.member.offboard"({ id }, { bus }) {
      const m = get(id);
      if (m.status === "offboarded") throw new CommandError(`${m.name} has already been offboarded.`, 409);
      // Direct reports move up to the leaver's manager so nobody is left without one.
      for (const r of members.all()) if (r.managerId === id) bus.publish("people.member.updated", members.put({ ...r, managerId: m.managerId }));
      const next = members.put({ ...m, status: "offboarded", managerId: null });
      bus.publish("people.member.offboarded", next);
      return next;
    },
    /** Called by door or desk readers. Returns a decision and records every scan as an event. */
    "people.badge.scan"({ uid, device }, { bus }): BadgeScan {
      if (!extensions.enabled("badge")) throw new CommandError("Badge readers are switched off. Turn on the Badge and NFC extension first.", 409);
      const m = members.all().find((x) => x.ext.badge?.uid === uid);
      const granted = !!m && m.status !== "offboarded";
      bus.publish("people.badge.scanned", { memberId: m?.id ?? null, uid, device, granted });
      return granted ? { granted, name: m!.name, staffNo: m!.staffNo } : { granted, reason: m ? "This badge belongs to someone who has left." : "This badge isn't registered to anyone." };
    },
    "people.member.remove"({ id }, { bus }) {
      const m = get(id);
      if (members.all().some((r) => r.managerId === id)) throw new CommandError(`${m.name} still manages people. Offboard them instead, or move their team first.`, 409);
      members.remove(id);
      bus.publish("people.member.removed", { id });
      return { id };
    },
  },
  rules: [
    {
      id: "onboarding-checklist",
      title: "New person → onboarding checklist",
      enabled: true,
      on: "people.member.created",
      run: "tasks.task.create",
      map: (m: Member) => [
        { title: `Create sign-in for ${m.name}`, source: "automation" },
        { title: `Issue ID card for ${m.name}`, source: "automation" },
        { title: `Welcome ${m.name} to ${m.department}`, source: "automation" },
      ],
    },
  ],
});
