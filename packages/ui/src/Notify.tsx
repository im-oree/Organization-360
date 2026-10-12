import { AnimatePresence, motion } from "motion/react";
import { motion as m } from "@o360/tokens";
import { useSyncExternalStore, type ComponentType } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cx } from "./cx";

type Kind = "success" | "error" | "warning" | "info";
type Action = { label: string; run: () => void };
type Note = { id: string; kind: Kind; title: string; detail?: string; action?: Action };

let notes: Note[] = [];
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
const durations: Record<Kind, number> = { success: 3500, info: 4000, warning: 6000, error: 8000 };

function push(kind: Kind, title: string, opts: { detail?: string; action?: Action } = {}) {
  const id = crypto.randomUUID();
  notes = [{ id, kind, title, ...opts }, ...notes.filter((n) => n.title !== title)].slice(0, 4);
  emit();
  setTimeout(() => dismiss(id), durations[kind]);
  return id;
}
function dismiss(id: string) {
  notes = notes.filter((n) => n.id !== id);
  emit();
}

/** One notification system for the whole platform. */
export const notify = {
  success: (title: string, opts?: { detail?: string; action?: Action }) => push("success", title, opts),
  error: (title: string, opts?: { detail?: string; action?: Action }) => push("error", title, opts),
  warning: (title: string, opts?: { detail?: string; action?: Action }) => push("warning", title, opts),
  info: (title: string, opts?: { detail?: string; action?: Action }) => push("info", title, opts),
  dismiss,
};

const look: Record<Kind, { icon: ComponentType<{ className?: string }>; color: string }> = {
  success: { icon: CircleCheck, color: "text-success" },
  error: { icon: CircleAlert, color: "text-danger" },
  warning: { icon: TriangleAlert, color: "text-warning" },
  info: { icon: Info, color: "text-accent" },
};

export function Notifications() {
  const list = useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => notes);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]">
      <AnimatePresence initial={false}>
        {list.map((n) => {
          const { icon: Icon, color } = look[n.kind];
          return (
            <motion.div
              key={n.id}
              layout
              role={n.kind === "error" ? "alert" : "status"}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
              transition={m.spring}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-brand border border-line bg-surface p-3.5 shadow-lift"
            >
              <Icon className={cx("mt-0.5 size-[18px] shrink-0", color)} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">{n.title}</p>
                {n.detail && <p className="mt-0.5 text-[13px] text-muted">{n.detail}</p>}
              </div>
              {n.action && (
                <button onClick={() => (n.action!.run(), dismiss(n.id))} className="shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-accent hover:bg-fill">
                  {n.action.label}
                </button>
              )}
              <button aria-label="Dismiss" onClick={() => dismiss(n.id)} className="shrink-0 rounded-md p-1 text-muted hover:bg-fill">
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
