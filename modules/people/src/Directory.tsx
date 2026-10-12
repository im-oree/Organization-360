import type { Member } from "@o360/contracts";
import { Avatar, Card, Empty, inputClass } from "@o360/ui";
import { ChevronRight, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { statusChip } from "./shared";

/** One list view, three slices: current staff, people onboarding, former staff. */
export function Directory({ people, loading, status: filter }: { people: Member[]; loading: boolean; status: "current" | "onboarding" | "offboarded" }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return people
      .filter((m) => (filter === "current" ? m.status !== "offboarded" : m.status === filter))
      .filter((m) => !s || [m.name, m.title, m.department, m.email, m.staffNo, m.handle].some((v) => v.toLowerCase().includes(s)));
  }, [people, q, filter]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input aria-label="Search staff" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, @handle, role, team or staff number" className={`${inputClass} pl-9`} />
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? null : list.length === 0 ? (
          <Empty>{q ? `No one matches "${q}".` : filter === "current" ? "No one here yet. Add the first person." : filter === "onboarding" ? "No one is onboarding right now." : "No former staff."}</Empty>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {list.map((m) => (
                <motion.li key={m.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-b border-line last:border-0">
                  <Link to={`/staffdesk/${m.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-fill">
                    <Avatar name={m.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{m.name}</p>
                      <p className="truncate text-[13px] text-muted">{m.title} · {m.department}</p>
                    </div>
                    <span className="hidden font-mono text-[12px] text-muted sm:block">{m.staffNo}</span>
                    <span className="hidden sm:block">{statusChip(m.status)}</span>
                    <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </>
  );
}
