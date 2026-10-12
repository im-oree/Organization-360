import type { InputHTMLAttributes } from "react";
import { cx } from "./cx";

export function Field({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-muted">{label}</span>
      <input
        className={cx(
          "h-10 w-full rounded-[10px] bg-fill px-3 text-[15px] text-ink outline-none ring-accent/50 transition-shadow placeholder:text-muted focus:ring-4",
          className,
        )}
        {...props}
      />
    </label>
  );
}
