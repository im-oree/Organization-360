import { AnimatePresence, motion } from "motion/react";
import { motion as m } from "@o360/tokens";
import { useSyncExternalStore } from "react";

type Toast = { id: string; text: string };
let toasts: Toast[] = [];
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

export function toast(text: string) {
  const id = crypto.randomUUID();
  toasts = [{ id, text }, ...toasts].slice(0, 3);
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3600);
}

export function Toaster() {
  const list = useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={m.spring}
            className="rounded-full border border-line bg-surface px-4 py-2 text-[14px] font-medium shadow-soft backdrop-blur-xl"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
