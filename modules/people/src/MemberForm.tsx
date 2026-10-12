import type { Member } from "@o360/contracts";
import { api, useAction } from "@o360/platform";
import { Button, Field, Select, Sheet } from "@o360/ui";
import type { FormEvent } from "react";

/** Add or edit a person. One form, one column, only what's needed. */
export function MemberForm({ member, people, onClose }: { member?: Member; people: Member[]; onClose: () => void }) {
  const managers = people.filter((p) => p.status !== "offboarded" && p.id !== member?.id);
  const { run, busy, fields } = useAction(
    (f: Record<string, string>) => {
      const input = { name: f.name!, email: f.email!, title: f.title!, department: f.department!, phone: f.phone ?? "", location: f.location ?? "", managerId: f.managerId || null, startDate: f.startDate || undefined };
      return member ? api.run<"people.member.update", Member>("people.member.update", { id: member.id, ...input }) : api.run<"people.member.create", Member>("people.member.create", input, crypto.randomUUID());
    },
    { success: (m) => (member ? "Profile saved" : `${m.name} added`) },
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await run(Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>)) onClose();
  }

  return (
    <Sheet open onClose={onClose} title={member ? `Edit ${member.name}` : "Add person"}>
      <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-0.5">
        <Field label="Full name" name="name" defaultValue={member?.name} required autoFocus error={fields.name} />
        <Field label="Work email" name="email" type="email" defaultValue={member?.email} required error={fields.email} />
        <Field label="Job title" name="title" defaultValue={member?.title} required error={fields.title} />
        <Field label="Team" name="department" defaultValue={member?.department} required error={fields.department} />
        <Select label="Manager" name="managerId" defaultValue={member?.managerId ?? ""}>
          <option value="">No manager</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.title}</option>)}
        </Select>
        {fields.managerId && <p className="text-[12px] text-danger">{fields.managerId}</p>}
        <Field label="Phone" name="phone" type="tel" inputMode="tel" defaultValue={member?.phone} error={fields.phone} className="max-w-[240px]" />
        <Field label="Office location" name="location" defaultValue={member?.location} error={fields.location} />
        <Field label="Start date" name="startDate" type="date" defaultValue={member?.startDate} hint={member ? undefined : "Leave empty to use today."} error={fields.startDate} className="max-w-[200px]" />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{member ? "Save profile" : "Add person"}</Button>
        </div>
      </form>
    </Sheet>
  );
}
