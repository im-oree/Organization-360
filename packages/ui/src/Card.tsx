import { motion, type HTMLMotionProps } from "motion/react";
import { motion as m } from "@o360/tokens";
import { cx } from "./cx";

export function Card({ className, interactive, ...props }: HTMLMotionProps<"div"> & { interactive?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={m.gentle}
      className={cx(
        "rounded-brand border border-line bg-surface shadow-soft",
        interactive && "cursor-pointer transition-[box-shadow,border-color] hover:border-accent/30 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}
