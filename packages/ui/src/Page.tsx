import { motion } from "motion/react";
import { motion as m } from "@o360/tokens";
import type { ReactNode } from "react";

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: m.ease }} className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-accent">{title}</h1>
          {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      {children}
    </motion.div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-[14px] text-muted">{children}</p>;
}

/** Inline load failure with a retry. Used wherever data fails to load. */
export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="max-w-sm text-[14px] text-muted">{message}</p>
      <button onClick={retry} className="text-[14px] font-semibold text-accent hover:underline">Try again</button>
    </div>
  );
}
