import { motion, type HTMLMotionProps } from "motion/react";
import { motion as m } from "@o360/tokens";
import { cx } from "./cx";

type Props = HTMLMotionProps<"button"> & { variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"; size?: "xs" | "sm" | "md" };

const variants = {
  primary: "bg-accent text-on-accent hover:opacity-90",
  secondary: "bg-accent-soft text-accent hover:bg-active",
  outline: "border border-line bg-surface text-ink hover:bg-fill",
  ghost: "text-muted hover:bg-fill hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
};
const sizes = { xs: "h-6 px-2 text-[12px] rounded-md", sm: "h-[30px] px-3 text-[13px] rounded-lg", md: "h-9 px-4 text-[14px] rounded-[9px]" };

export function Button({ variant = "primary", size = "md", className, ...props }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={m.spring}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap transition-[opacity,background-color,color] disabled:pointer-events-none disabled:opacity-40",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
