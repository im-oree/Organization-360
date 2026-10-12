import type { Member } from "@o360/contracts";
import { Avatar, Empty } from "@o360/ui";
import { motion } from "motion/react";
import { Link } from "react-router";

export function OrgChart({ people }: { people: Member[] }) {
  const current = people.filter((m) => m.status !== "offboarded");
  const ids = new Set(current.map((m) => m.id));
  const roots = current.filter((m) => !m.managerId || !ids.has(m.managerId));
  if (!current.length) return <Empty>The org chart fills in as you add people.</Empty>;
  return (
    <div className="overflow-x-auto pb-4">
      <ul className="flex min-w-max gap-8">{roots.map((r) => <Node key={r.id} m={r} all={current} depth={0} />)}</ul>
    </div>
  );
}

function Node({ m, all, depth }: { m: Member; all: Member[]; depth: number }) {
  const reports = all.filter((r) => r.managerId === m.id);
  return (
    <li className="flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: depth * 0.06 }}>
        <Link to={`/staffdesk/${m.id}`} className="flex w-52 items-center gap-2.5 rounded-brand border border-line bg-surface p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
          <Avatar name={m.name} size={30} />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">{m.name}</span>
            <span className="block truncate text-[12px] text-muted">{m.title}</span>
          </span>
        </Link>
      </motion.div>
      {reports.length > 0 && (
        <>
          <span className="h-5 w-px bg-line" />
          <ul className="relative flex gap-4 pt-5 before:absolute before:left-[104px] before:right-[104px] before:top-0 before:h-px before:bg-line">
            {reports.map((r) => (
              <div key={r.id} className="relative before:absolute before:left-1/2 before:-top-5 before:h-5 before:w-px before:bg-line">
                <Node m={r} all={all} depth={depth + 1} />
              </div>
            ))}
          </ul>
        </>
      )}
    </li>
  );
}
