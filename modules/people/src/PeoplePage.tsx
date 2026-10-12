import type { Member } from "@o360/contracts";
import { api, useAction, useCan, useResource } from "@o360/platform";
import { Avatar, Button, Card, confirm, Empty, Field, inputClass, LoadError, Page, Sheet } from "@o360/ui";
import { Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";

export default function PeoplePage() {
  const can = useCan();
  const { data = [], loading, error, reload } = useResource<Member[]>("/people", "people.");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const remove = useAction((m: Member) => api.run("people.member.remove", { id: m.id }), { success: "Removed from the directory" });

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? data.filter((m) => [m.name, m.title, m.department, m.email].some((v) => v.toLowerCase().includes(s))) : data;
  }, [data, q]);

  async function ask(m: Member) {
    if (await confirm({ title: `Remove ${m.name}?`, detail: "They'll disappear from the directory for everyone. This can't be undone.", confirm: "Remove", danger: true })) void remove.run(m);
  }

  return (
    <Page
      title="Staff"
      subtitle={data.length ? `${data.length} people` : undefined}
      actions={can("people.member.create") && <Button onClick={() => setAdding(true)}><Plus className="size-4" strokeWidth={2.5} />Add person</Button>}
    >
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input aria-label="Search staff" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, role or team" className={`${inputClass} pl-9`} />
      </div>

      <Card className="overflow-hidden">
        {error ? <LoadError message={error.message} retry={reload} /> : loading ? null : list.length === 0 ? (
          <Empty>{q ? `No one matches "${q}".` : "No one here yet. Add the first person."}</Empty>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {list.map((m) => (
                <motion.li key={m.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="group border-b border-line last:border-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={m.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{m.name}</p>
                      <p className="truncate text-[13px] text-muted">{m.title} · {m.department}</p>
                    </div>
                    <a href={`mailto:${m.email}`} className="hidden truncate text-[13px] text-accent hover:underline md:block">{m.email}</a>
                    {can("people.member.remove") && (
                      <button aria-label={`Remove ${m.name}`} onClick={() => ask(m)} className="grid size-9 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-fill hover:text-danger focus:opacity-100 group-hover:opacity-100">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
      <AddMember open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}

function AddMember({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { run, busy, fields } = useAction(
    (input: { name: string; email: string; title: string; department: string }) => api.run<"people.member.create", Member>("people.member.create", input, crypto.randomUUID()),
    { success: (m) => `${m.name} added` },
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (await run({ name: f.name!, email: f.email!, title: f.title!, department: f.department! })) onClose();
  }
  return (
    <Sheet open={open} onClose={onClose} title="Add person">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" name="name" required autoFocus error={fields.name} />
        <Field label="Work email" name="email" type="email" required error={fields.email} />
        <Field label="Job title" name="title" required error={fields.title} />
        <Field label="Team" name="department" required error={fields.department} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>Add person</Button>
        </div>
      </form>
    </Sheet>
  );
}
