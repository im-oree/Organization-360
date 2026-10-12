import { motion } from "motion/react";

export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)} className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-success" : "bg-line"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 34 }} className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow ${on ? "right-[2px]" : "left-[2px]"}`} />
    </button>
  );
}
