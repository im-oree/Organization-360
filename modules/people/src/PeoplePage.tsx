import type { Member } from "@o360/contracts";
import { api, ApiError, useResource } from "@o360/platform";
import { Avatar, Button, Card, Empty, Field, Page, Sheet, toast } from "@o360/ui";
import { Plus, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";

export default function PeoplePage() {
  const { data = [], loading } = useResource<Member[]>("/people", "people.");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? data.filter((m) => [m.name, m.title, m.department, m.email].some((v) => v.toLowerCase().includes(s))) : data;
  }, [data, q]);

  return (
    <Page title="People" actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" strokeWidth={2.5} />Add</Button>}>
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="h-10 w-full rounded-[10px] bg-fill pl-9 pr-3 text-[15px] outline-none ring-accent/50 focus:ring-4"
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? null : list.length === 0 ? (
          <Empty>No matches</Empty>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {list.map((m) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group border-b border-line last:border-0"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={m.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{m.name}</p>
                      <p className="truncate text-[13px] text-muted">{m.title} · {m.department}</p>
                    </div>
                    <button
                      aria-label={`Remove ${m.name}`}
                      onClick={() => api.run("people.member.remove", { id: m.id })}
                      className="grid size-8 place-items-center rounded-full text-muted opacity-0 transition hover:bg-fill group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="size-4" />
                    </button>
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setError("");
    try {
      await api.run("people.member.create", { name: f.name!, email: f.email!, title: f.title!, department: f.department! }, crypto.randomUUID());
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      if (!(err instanceof ApiError)) toast("Couldn't reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="New member">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" name="name" required autoFocus />
        <Field label="Email" name="email" type="email" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" name="title" required />
          <Field label="Department" name="department" required />
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>Add</Button>
        </div>
      </form>
    </Sheet>
  );
}
