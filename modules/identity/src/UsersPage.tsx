import type { Role, User } from "@o360/contracts";
import { api, useAction, useAuth, useCan, useResource } from "@o360/platform";
import { Avatar, Button, Card, Checkbox, Chip, Empty, Field, LoadError, Page, Sheet } from "@o360/ui";
import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";

export default function UsersPage() {
  const can = useCan();
  const { me } = useAuth();
  const { data: users = [], error, reload, loading } = useResource<User[]>("/users", "identity.");
  const { data: roles = [] } = useResource<Role[]>("/roles", "identity.role.");
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "Removed role";

  return (
    <Page title="Users" subtitle="People who can sign in, and their roles." actions={can("identity.user.create") && <Button onClick={() => setEditing("new")}><Plus className="size-4" strokeWidth={2.5} />Invite user</Button>}>
      <Card className="overflow-x-auto">
        {error ? <LoadError message={error.message} retry={reload} /> : loading ? null : users.length === 0 ? <Empty>No users yet.</Empty> : (
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="border-b border-line text-[12px] font-semibold uppercase tracking-wide text-label">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <div className="min-w-0"><p className="font-semibold">{u.name}{u.id === me?.id && <span className="font-normal text-muted"> (you)</span>}</p><p className="text-[13px] text-muted">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{u.roleIds.map((r) => <Chip key={r} tone="navy">{roleName(r)}</Chip>)}</div></td>
                  <td className="px-4 py-3">
                    {u.status === "active" ? <Chip tone="green">Active</Chip> : <Chip tone="red">Paused</Chip>}
                    {u.mustChangePassword && <span className="ml-1"><Chip tone="amber">Invited</Chip></span>}
                  </td>
                  <td className="px-4 py-3 text-right">{can("identity.user.update") && <Button size="sm" variant="outline" onClick={() => setEditing(u)}>Edit</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {editing === "new" && <InviteUser roles={roles} onClose={() => setEditing(null)} />}
      {editing && editing !== "new" && <EditUser user={editing} roles={roles} onClose={() => setEditing(null)} />}
    </Page>
  );
}

function RolePicker({ roles, selected, onChange }: { roles: Role[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium">Roles</legend>
      {roles.map((r) => (
        <Checkbox key={r.id} label={r.name} checked={selected.includes(r.id)} onChange={(e) => onChange(e.target.checked ? [...selected, r.id] : selected.filter((x) => x !== r.id))} />
      ))}
    </fieldset>
  );
}

function InviteUser({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const [roleIds, setRoleIds] = useState(["member"]);
  const { run, busy, fields, setFields } = useAction(
    (input: { name: string; email: string; password: string; roleIds: string[] }) => api.run<"identity.user.create", User>("identity.user.create", input),
    { success: (u) => `${u.name} can now sign in` },
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!roleIds.length) return setFields({ roleIds: "Pick at least one role so they can use something after signing in." });
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (await run({ name: f.name!, email: f.email!, password: f.password!, roleIds })) onClose();
  }
  return (
    <Sheet open onClose={onClose} title="Invite user">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" name="name" required autoFocus error={fields.name} />
        <Field label="Email" name="email" type="email" required error={fields.email} />
        <Field label="Temporary password" name="password" type="text" minLength={8} required hint="Share it privately. They'll choose their own on first sign-in." error={fields.password} />
        <RolePicker roles={roles} selected={roleIds} onChange={setRoleIds} />
        {fields.roleIds && <p className="text-[12px] text-danger">{fields.roleIds}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>Invite</Button>
        </div>
      </form>
    </Sheet>
  );
}

function EditUser({ user, roles, onClose }: { user: User; roles: Role[]; onClose: () => void }) {
  const [roleIds, setRoleIds] = useState(user.roleIds);
  const save = useAction((input: { roleIds?: string[]; status?: "active" | "suspended" }) => api.run("identity.user.update", { id: user.id, ...input }), { success: "Changes saved" });
  const paused = user.status === "suspended";
  return (
    <Sheet open onClose={onClose} title={user.name}>
      <div className="space-y-6">
        <RolePicker roles={roles} selected={roleIds} onChange={setRoleIds} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
          <Button variant={paused ? "secondary" : "ghost"} className={paused ? "" : "text-danger"} disabled={save.busy} onClick={async () => (await save.run({ status: paused ? "active" : "suspended" })) && onClose()}>
            {paused ? "Turn account back on" : "Pause account"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={save.busy || !roleIds.length} onClick={async () => (await save.run({ roleIds })) && onClose()}>Save roles</Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
