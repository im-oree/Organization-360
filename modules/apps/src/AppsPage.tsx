import type { Catalogue } from "@o360/contracts";
import { api, DefField, useAction, useCatalogue } from "@o360/platform";
import { Button, Card, Chip, LoadError, Page, Sheet, Switch } from "@o360/ui";
import { useState, type FormEvent } from "react";

type Ext = Catalogue["extensions"][number];

export default function AppsPage() {
  const { data, error, reload } = useCatalogue();
  const [configuring, setConfiguring] = useState<Ext | null>(null);
  const save = useAction(
    (e: Ext, enabled: boolean, settings: Record<string, string> = e.values) => api.run<"platform.extension.save", { enabled: boolean }>("platform.extension.save", { id: e.id, enabled, settings }),
    { success: (s) => (s.enabled ? "Extension is on" : "Extension is off. Its data is kept.") },
  );

  if (error) return <Page title="Apps & extensions"><LoadError message={error.message} retry={reload} /></Page>;
  const apps = data?.apps.filter((a) => a.id !== "platform") ?? [];

  return (
    <Page title="Apps & extensions" subtitle="Switch add-ons on for the whole organization.">
      <div className="space-y-8">
        {apps.map((a) => {
          const exts = data!.extensions.filter((e) => e.app === a.id);
          return (
            <section key={a.id}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-accent">{a.title}</h2>
                <Chip tone="green">Installed</Chip>
              </div>
              {exts.length === 0 ? (
                <p className="text-[14px] text-muted">No extensions for this app yet.</p>
              ) : (
                <Card className="overflow-hidden">
                  {exts.map((e) => (
                    <div key={e.id} className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3.5 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold">{e.title}</p>
                        <p className="text-[13px] text-muted">{e.summary}</p>
                      </div>
                      {e.enabled && e.settings.length > 0 && <Button size="sm" variant="outline" onClick={() => setConfiguring(e)}>Settings</Button>}
                      <Switch on={e.enabled} disabled={save.busy} label={e.title} onChange={(on) => save.run(e, on)} />
                    </div>
                  ))}
                </Card>
              )}
            </section>
          );
        })}
      </div>
      {configuring && <SettingsSheet ext={configuring} busy={save.busy} onClose={() => setConfiguring(null)} onSave={(s) => save.run(configuring, true, s)} />}
    </Page>
  );
}

function SettingsSheet({ ext, busy, onClose, onSave }: { ext: Ext; busy: boolean; onClose: () => void; onSave: (s: Record<string, string>) => Promise<unknown> }) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (await onSave(Object.fromEntries(Object.entries(form).map(([k, v]) => [k.replace(/^s\./, ""), v])))) onClose();
  }
  return (
    <Sheet open onClose={onClose} title={ext.title}>
      <form onSubmit={submit} className="space-y-4">
        {ext.settings.map((d) => <DefField key={d.key} def={d} prefix="s" value={ext.values[d.key]} />)}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>Save settings</Button>
        </div>
      </form>
    </Sheet>
  );
}
