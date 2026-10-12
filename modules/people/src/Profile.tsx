import type { Member } from "@o360/contracts";
import { api, ExtensionValues, useAction, useCan } from "@o360/platform";
import { Avatar, Button, Card, confirm, Empty } from "@o360/ui";
import { ArrowLeft, Printer } from "lucide-react";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { IdCard } from "./IdCard";
import { MemberForm } from "./MemberForm";
import { statusChip } from "./shared";

export function Profile({ people }: { people: Member[] }) {
  const { id } = useParams();
  const can = useCan();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const m = people.find((p) => p.id === id);

  const activate = useAction(() => api.run("people.member.activate", { id: id! }), { success: "Onboarding complete" });
  const offboard = useAction(() => api.run("people.member.offboard", { id: id! }), { success: "Offboarded. Their sign-in is paused and their team moved up a level." });
  const remove = useAction(() => api.run("people.member.remove", { id: id! }), { success: "Record deleted" });

  if (!people.length) return null;
  if (!m) return <Empty>This person isn't in the directory anymore. <Link to="/staff" className="font-semibold text-accent hover:underline">Back to StaffDesk</Link></Empty>;

  const manager = people.find((p) => p.id === m.managerId);
  const reports = people.filter((p) => p.managerId === m.id && p.status !== "offboarded");

  async function askOffboard() {
    if (await confirm({ title: `Offboard ${m!.name}?`, detail: "Their ID stops verifying, their sign-in is paused, and anyone they manage moves to their manager.", confirm: "Offboard", danger: true })) void offboard.run();
  }
  async function askRemove() {
    if (await confirm({ title: `Delete ${m!.name}'s record?`, detail: "The record is removed for good. Offboarding keeps history, so prefer that for people who leave.", confirm: "Delete record", danger: true }))
      if (await remove.run()) navigate("/staff");
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl">
      <Link to="/staff" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink print:hidden">
        <ArrowLeft className="size-4" />StaffDesk
      </Link>

      <Card className="mb-5 flex flex-wrap items-center gap-4 p-5 print:hidden">
        <Avatar name={m.name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-[20px] font-bold text-accent">{m.name}</h1>{statusChip(m.status)}</div>
          <p className="text-[14px] text-muted">{m.title} · {m.department}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {m.status === "onboarding" && can("people.member.activate") && <Button disabled={activate.busy} onClick={() => activate.run()}>Complete onboarding</Button>}
          {m.status !== "offboarded" && can("people.member.update") && <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5 print:hidden">
          <Card className="p-5">
            <h2 className="mb-3 text-[15px] font-bold text-accent">Details</h2>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Detail label="Email"><a href={`mailto:${m.email}`} className="text-accent hover:underline">{m.email}</a></Detail>
              <Detail label="Phone">{m.phone ? <a href={`tel:${m.phone}`} className="text-accent hover:underline">{m.phone}</a> : "—"}</Detail>
              <Detail label="Staff number"><span className="font-mono">{m.staffNo}</span></Detail>
              <Detail label="Office">{m.location || "—"}</Detail>
              <Detail label="Started">{new Date(m.startDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</Detail>
              <Detail label="Manager">{manager ? <Link to={`/staff/${manager.id}`} className="text-accent hover:underline">{manager.name}</Link> : "—"}</Detail>
              <ExtensionValues app="people" values={m.ext} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-[15px] font-bold text-accent">Team <span className="font-normal text-muted">{reports.length || ""}</span></h2>
            {reports.length === 0 ? <p className="text-[14px] text-muted">No direct reports.</p> : (
              <ul className="space-y-1">
                {reports.map((r) => (
                  <li key={r.id}>
                    <Link to={`/staff/${r.id}`} className="-mx-2 flex items-center gap-3 rounded-lg p-2 hover:bg-fill">
                      <Avatar name={r.name} size={28} /><span className="text-[14px] font-medium">{r.name}</span><span className="text-[13px] text-muted">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {(can("people.member.offboard") || can("people.member.remove")) && (
            <div className="flex flex-wrap gap-2">
              {m.status !== "offboarded" && can("people.member.offboard") && <Button variant="ghost" className="text-danger" disabled={offboard.busy} onClick={askOffboard}>Offboard</Button>}
              {can("people.member.remove") && <Button variant="ghost" className="text-muted" disabled={remove.busy} onClick={askRemove}>Delete record</Button>}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <h2 className="text-[15px] font-bold text-accent print:hidden">ID card</h2>
          {m.status === "offboarded" ? <p className="text-[14px] text-muted">ID cards stop working once someone is offboarded.</p> : (
            <>
              <IdCard member={m} />
              <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden"><Printer className="size-4" />Print card</Button>
            </>
          )}
        </aside>
      </div>
      {editing && <MemberForm member={m} people={people} onClose={() => setEditing(false)} />}
    </motion.div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-label">{label}</dt>
      <dd className="mt-0.5 text-[14px]">{children}</dd>
    </div>
  );
}
