import { api } from "@o360/platform";
import { Chip } from "@o360/ui";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type Account = { name: string; email: string; password: string; role: string };

/** Development only: one demo account per role. Click to fill the sign-in form. */
export function DemoAccounts({ onPick }: { onPick: (a: Account) => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    api.get<Account[]>("/dev/accounts").then(setAccounts, () => setAccounts([]));
  }, []);
  if (!accounts.length) return null;

  return (
    <div className="mt-4 rounded-brand border border-dashed border-line bg-surface">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-muted hover:text-ink">
        Demo accounts · {accounts.length}
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line">
            {accounts.map((a) => (
              <li key={a.email}>
                <button onClick={() => onPick(a)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-fill">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{a.name}</span>
                    <span className="block truncate text-[12px] text-muted">{a.email}</span>
                  </span>
                  <Chip tone="navy">{a.role}</Chip>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
