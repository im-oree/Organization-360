import { useSyncExternalStore } from "react";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

type Ask = { title: string; detail: string; confirm: string; danger?: boolean; resolve: (ok: boolean) => void };
let current: Ask | null = null;
const subs = new Set<() => void>();
const set = (a: Ask | null) => ((current = a), subs.forEach((s) => s()));

/** Promise-based confirmation for irreversible actions. Prefer undo for reversible ones. */
export const confirm = (o: Omit<Ask, "resolve">) => new Promise<boolean>((resolve) => set({ ...o, resolve }));

export function ConfirmHost() {
  const a = useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => current);
  const close = (ok: boolean) => (a?.resolve(ok), set(null));
  return (
    <Sheet open={!!a} onClose={() => close(false)} title={a?.title ?? ""}>
      <p className="mb-6 text-[14px] text-muted">{a?.detail}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
        <Button variant={a?.danger ? "danger" : "primary"} onClick={() => close(true)}>{a?.confirm}</Button>
      </div>
    </Sheet>
  );
}
