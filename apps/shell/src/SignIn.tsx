import { api, BrandMark, useAction, useAuth, useBrand } from "@o360/platform";
import { Button, Field } from "@o360/ui";
import { motion } from "motion/react";
import { useRef, type FormEvent } from "react";
import { DemoAccounts } from "./DemoAccounts";

export function SignIn() {
  const brand = useBrand();
  const { signIn } = useAuth();
  const { run, busy, fields } = useAction(signIn);
  const form = useRef<HTMLFormElement>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run(String(f.get("email")), String(f.get("password")));
  }

  return (
    <main className="grid min-h-full place-items-center p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12 rounded-xl" />
          <h1 className="text-[22px] font-bold text-accent">Sign in to {brand.name}</h1>
        </div>
        <form ref={form} onSubmit={submit} className="space-y-4 rounded-brand border border-line bg-surface p-6 shadow-soft">
          <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus error={fields.email} />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required error={fields.password} />
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <DemoAccounts
          onPick={(a) => {
            const f = form.current!;
            (f.elements.namedItem("email") as HTMLInputElement).value = a.email;
            (f.elements.namedItem("password") as HTMLInputElement).value = a.password;
            f.requestSubmit();
          }}
        />
      </motion.div>
    </main>
  );
}

export function ChangePassword() {
  const { refresh, signOut } = useAuth();
  const { run, busy, fields, setFields } = useAction(async (current: string, next: string) => {
    await api.run("identity.password.change", { current, next });
    await refresh();
  }, { success: "Password updated" });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = String(f.get("next"));
    if (next !== f.get("confirm")) return setFields({ confirm: "The two new passwords don't match yet." });
    void run(String(f.get("current")), next);
  }

  return (
    <main className="grid min-h-full place-items-center p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px]">
        <h1 className="mb-2 text-center text-[22px] font-bold text-accent">Choose your password</h1>
        <p className="mb-8 text-center text-[14px] text-muted">Replace the temporary password you were given.</p>
        <form onSubmit={submit} className="space-y-4 rounded-brand border border-line bg-surface p-6 shadow-soft">
          <Field label="Temporary password" name="current" type="password" autoComplete="current-password" required error={fields.current} />
          <Field label="New password" name="next" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." error={fields.next} />
          <Field label="Repeat new password" name="confirm" type="password" autoComplete="new-password" required error={fields.confirm} />
          <Button type="submit" disabled={busy} className="w-full">Save password</Button>
          <button type="button" onClick={signOut} className="w-full text-center text-[13px] text-muted hover:text-ink">Sign out</button>
        </form>
      </motion.div>
    </main>
  );
}
