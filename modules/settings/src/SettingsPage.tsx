import type { Prefs } from "@o360/contracts";
import { api, applyTheme, useAction, useAuth } from "@o360/platform";
import { Button, Card, cx, Field, notify, Page, Switch } from "@o360/ui";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Route, Routes } from "react-router";

export default function SettingsPage() {
  return (
    <Routes>
      <Route index element={<Appearance />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="account" element={<Account />} />
    </Routes>
  );
}

function useSavePrefs() {
  const { refresh } = useAuth();
  return useAction(async (patch: Partial<Prefs>) => {
    await api.run("identity.prefs.save", patch);
    await refresh();
  });
}

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Match my device", icon: Monitor },
] as const;

function Appearance() {
  const { me } = useAuth();
  const save = useSavePrefs();
  const current = me?.prefs.theme ?? "system";

  async function choose(theme: Prefs["theme"]) {
    if (theme === current) return;
    const previous = current;
    applyTheme(theme);
    if (await save.run({ theme })) notify.success("Appearance updated", { action: { label: "Undo", run: () => (applyTheme(previous), void save.run({ theme: previous })) } });
    else applyTheme(previous);
  }

  return (
    <Page title="Appearance" subtitle="Choose how the app looks on this account. It follows you to every device.">
      <div role="radiogroup" aria-label="Theme" className="grid gap-4 sm:grid-cols-3">
        {themes.map((t) => {
          const selected = current === t.id;
          return (
            <button key={t.id} role="radio" aria-checked={selected} onClick={() => choose(t.id)} disabled={save.busy} className="text-left">
              <motion.div whileHover={{ y: -2 }} className={cx("overflow-hidden rounded-brand border-2 bg-surface transition-colors", selected ? "border-accent" : "border-line hover:border-accent/30")}>
                <Preview mode={t.id} />
                <div className="flex items-center gap-2 px-4 py-3">
                  <t.icon className="size-4 text-muted" />
                  <span className="flex-1 text-[14px] font-semibold">{t.label}</span>
                  {selected && <span className="grid size-5 place-items-center rounded-full bg-accent text-on-accent"><Check className="size-3" strokeWidth={3} /></span>}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
    </Page>
  );
}

/** A miniature of the app in each theme, so the choice is visual. */
function Preview({ mode }: { mode: Prefs["theme"] }) {
  const pane = (dark: boolean) => (
    <div className={cx("flex h-full flex-1", dark ? "bg-[#0c111f]" : "bg-[#f8f9fc]")}>
      <div className={cx("w-1/4 space-y-1.5 border-r p-2", dark ? "border-[#232a42] bg-[#141a2d]" : "border-[#e5e7eb] bg-white")}>
        <div className={cx("h-1.5 w-3/4 rounded", dark ? "bg-[#a7b8f7]" : "bg-[#002986]")} />
        {[0, 1, 2].map((i) => <div key={i} className={cx("h-1.5 rounded", dark ? "bg-[#232a42]" : "bg-[#e5e7eb]")} />)}
      </div>
      <div className="flex-1 space-y-2 p-2.5">
        <div className={cx("h-2 w-1/2 rounded", dark ? "bg-[#a7b8f7]" : "bg-[#002986]")} />
        <div className={cx("h-8 rounded-md border", dark ? "border-[#232a42] bg-[#141a2d]" : "border-[#e5e7eb] bg-white")} />
        <div className={cx("h-8 rounded-md border", dark ? "border-[#232a42] bg-[#141a2d]" : "border-[#e5e7eb] bg-white")} />
      </div>
    </div>
  );
  return <div className="flex h-28 border-b border-line">{mode === "system" ? <>{pane(false)}{pane(true)}</> : pane(mode === "dark")}</div>;
}

function Row({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[13px] text-muted">{detail}</p>
      </div>
      {children}
    </div>
  );
}

function Notifications() {
  const { me } = useAuth();
  const save = useSavePrefs();
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const prefs = me!.prefs;

  async function toggleDesktop(on: boolean) {
    if (on && permission === "default") {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p !== "granted") return notify.warning("Your browser blocked notifications", { detail: "Allow them for this site in your browser's settings, then try again." });
    }
    await save.run({ desktopNotifications: on });
  }

  return (
    <Page title="Notifications" subtitle="We only notify you when you're away from the app, and never with sounds.">
      <Card>
        <Row title="Desktop notifications" detail={permission === "denied" ? "Your browser is blocking them. Allow notifications for this site in the browser's settings." : permission === "unsupported" ? "This browser doesn't support them." : "A quiet notice for new messages while the app isn't in front."}>
          <Switch label="Desktop notifications" on={prefs.desktopNotifications && permission === "granted"} disabled={save.busy || permission === "denied" || permission === "unsupported"} onChange={toggleDesktop} />
        </Row>
        <Row title="Show message previews" detail="Include the first line of the message. Turn off to show only who sent it.">
          <Switch label="Show message previews" on={prefs.notificationPreview} disabled={save.busy} onChange={(v) => save.run({ notificationPreview: v })} />
        </Row>
      </Card>
    </Page>
  );
}

function Account() {
  const { me } = useAuth();
  const { run, busy, fields, setFields } = useAction((current: string, next: string) => api.run("identity.password.change", { current, next }), { success: "Password changed" });
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("next") !== f.get("confirm")) return setFields({ confirm: "The two new passwords don't match yet." });
    if (await run(String(f.get("current")), String(f.get("next")))) form.reset();
  }
  return (
    <Page title="Account">
      <div className="grid max-w-3xl gap-5">
        <Card className="p-5">
          <h2 className="mb-3 text-[15px] font-bold text-accent">Signed in as</h2>
          <p className="text-[14px] font-semibold">{me?.name}</p>
          <p className="text-[14px] text-muted">{me?.email}</p>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-bold text-accent">Change password</h2>
          <form onSubmit={submit} className="max-w-sm space-y-4">
            <Field label="Current password" name="current" type="password" autoComplete="current-password" required error={fields.current} />
            <Field label="New password" name="next" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." error={fields.next} />
            <Field label="Repeat new password" name="confirm" type="password" autoComplete="new-password" required error={fields.confirm} />
            <Button type="submit" disabled={busy}>Change password</Button>
          </form>
        </Card>
      </div>
    </Page>
  );
}
