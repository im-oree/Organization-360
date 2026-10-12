import { motion, type HTMLMotionProps } from "motion/react";
import { motion as m } from "@o360/tokens";
import { cx } from "./cx";

type Props = HTMLMotionProps<"button"> & { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" };

const variants = {
  primary: "bg-accent text-on-accent",
  secondary: "bg-fill text-ink",
  ghost: "text-accent hover:bg-fill",
};

export function Button({ variant = "primary", size = "md", className, ...props }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={m.spring}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-[opacity,background-color] disabled:opacity-40",
        size === "md" ? "h-9 px-4 text-[15px]" : "h-7 px-3 text-[13px]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
