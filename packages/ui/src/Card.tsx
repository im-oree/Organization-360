import { motion, type HTMLMotionProps } from "motion/react";
import { motion as m } from "@o360/tokens";
import { cx } from "./cx";

export function Card({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={m.gentle}
      className={cx("rounded-brand border border-line bg-surface-solid shadow-soft", className)}
      {...props}
    />
  );
}
