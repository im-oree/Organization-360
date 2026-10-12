import { motion } from "motion/react";
import { motion as m } from "@o360/tokens";
import type { ReactNode } from "react";

export function Page({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: m.ease }}
      className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-8 sm:pt-12"
    >
      <header className="mb-8 flex items-end justify-between gap-4">
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[34px]">{title}</h1>
        {actions}
      </header>
      {children}
    </motion.main>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-16 text-center text-[15px] text-muted">{children}</p>;
}
