import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cx } from "./cx";

const control = "h-10 w-full rounded-[9px] border border-line bg-surface px-3 text-[14px] text-ink outline-none transition-shadow placeholder:text-muted focus:border-accent/50 focus:shadow-ring";

/** Labelled input with inline error, announced to screen readers. */
export function Field({ label, error, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = props.type === "password";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium">{label}{!props.required && <span className="font-normal text-muted"> (optional)</span>}</label>
      <div className="relative">
        <input id={id} aria-invalid={!!error} aria-describedby={`${id}-msg`} className={cx(control, error && "border-danger/60", isPassword && "pr-11", className)} {...props} type={isPassword && shown ? "text" : props.type} />
        {isPassword && (
          <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[9px] text-muted hover:text-ink">
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      <p id={`${id}-msg`} aria-live="polite" className={cx("mt-1 text-[12px]", error ? "text-danger" : "text-muted")}>{error ?? hint}</p>
    </div>
  );
}

export function Select({ label, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const el = <select className={cx(control, "pr-8", className)} {...props}>{children}</select>;
  return label ? <label className="block"><span className="mb-1.5 block text-[13px] font-medium">{label}</span>{el}</label> : el;
}

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[14px]">
      <input type="checkbox" className="size-4 rounded accent-[var(--o-accent)]" {...props} />
      {label}
    </label>
  );
}

export const inputClass = control;
