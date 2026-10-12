import type { AppDef, Role } from "@o360/contracts";
import { api, useAction, useCan, useCatalogue, useResource } from "@o360/platform";
import { Button, Card, Checkbox, Chip, Field, LoadError, Page, Sheet } from "@o360/ui";
import { Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export default function RolesPage() {
  const can = useCan();
  const { data: roles = [], error, reload } = useResource<Role[]>("/roles", "identity.role.");
  const [editing, setEditing] = useState<Role | "new" | null>(null);

  return (
    <Page title="Roles" subtitle="Each role is a set of things its holders can do." actions={can("identity.role.save") && <Button onClick={() => setEditing("new")}><Plus className="size-4" strokeWidth={2.5} />New role</Button>}>
      {error ? <LoadError message={error.message} retry={reload} /> : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.id} interactive={can("identity.role.save") && r.id !== "owner"} onClick={() => can("identity.role.save") && r.id !== "owner" && setEditing(r)} className="border-t-[3px] border-t-accent p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-bold text-accent">{r.name}</h2>
                {r.id === "owner" && <Chip tone="navy">Full access</Chip>}
              </div>
              <p className="text-[13px] text-muted">{describe(r)}</p>
            </Card>
          ))}
        </div>
      )}
      {editing && <EditRole role={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </Page>
  );
}

function describe(r: Role) {
  if (r.permissions.includes("*")) return "Can do everything, everywhere.";
  if (!r.permissions.length) return "No access yet.";
  return `${r.permissions.length} permission${r.permissions.length === 1 ? "" : "s"}: ${r.permissions.slice(0, 3).join(", ")}${r.permissions.length > 3 ? "…" : ""}`;
}

/** Expand wildcards to concrete keys so the editor always shows explicit choices. */
const expand = (perms: string[], apps: AppDef[]) =>
  apps.flatMap((g) => g.permissions.map((k) => k.key)).filter((k) => perms.some((p) => p === k || (p.endsWith(".*") && k.startsWith(p.slice(0, -1)))));

/** When every permission of an app is ticked, save `<app>.*` so future permissions are included too. */
function compress(perms: string[], apps: AppDef[]) {
  let out = [...perms];
  for (const a of apps) {
    const keys = a.permissions.map((p) => p.key);
    const prefixes = [...new Set(keys.map((k) => k.split(".")[0]))];
    if (prefixes.length !== 1 || !keys.every((k) => out.includes(k))) continue;
    out = [...out.filter((k) => !k.startsWith(`${prefixes[0]}.`)), `${prefixes[0]}.*`];
  }
  return out;
}

function EditRole({ role, onClose }: { role?: Role; onClose: () => void }) {
  const apps = useCatalogue().data?.apps ?? [];
  const [perms, setPerms] = useState<string[]>([]);
  useEffect(() => {
    if (role && apps.length) setPerms(expand(role.permissions, apps));
  }, [role, apps.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const { run, busy, fields } = useAction((input: { id?: string; name: string; permissions: string[] }) => api.run("identity.role.save", input), { success: "Role saved" });
  const toggle = (k: string, on: boolean) => setPerms((p) => (on ? [...p, k] : p.filter((x) => x !== k)));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await run({ id: role?.id, name: String(new FormData(e.currentTarget).get("name")), permissions: perms })) onClose();
  }

  return (
    <Sheet open onClose={onClose} title={role ? `Edit ${role.name}` : "New role"}>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Role name" name="name" defaultValue={role?.name} required autoFocus error={fields.name} />
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {apps.map((g) => {
            const all = g.permissions.every((k) => perms.includes(k.key));
            return (
              <fieldset key={g.id} className="rounded-[10px] border border-line p-3">
                <legend className="flex w-full items-center justify-between px-1 text-[13px] font-bold text-accent">
                  {g.title}
                </legend>
                <button type="button" onClick={() => g.permissions.forEach((k) => toggle(k.key, !all))} className="mb-1 text-[12px] font-semibold text-accent hover:underline">
                  {all ? "Clear all" : "Select all"}
                </button>
                {g.permissions.map((k) => <Checkbox key={k.key} label={k.label} checked={perms.includes(k.key)} onChange={(e) => toggle(k.key, e.target.checked)} />)}
              </fieldset>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>Save role</Button>
        </div>
      </form>
    </Sheet>
  );
}
