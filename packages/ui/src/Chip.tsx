import type { ReactNode } from "react";
import { cx } from "./cx";

const tones = {
  green: "bg-[#dcfce7] text-[#166534]",
  amber: "bg-[#fef3c7] text-[#92400e]",
  red: "bg-[#fee2e2] text-[#991b1b]",
  gray: "bg-fill text-muted",
  navy: "bg-accent-soft text-accent",
};

export function Chip({ tone = "gray", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold", tones[tone])}>{children}</span>;
}
