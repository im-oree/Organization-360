import type { Member } from "@o360/contracts";
import { useCan, useResource } from "@o360/platform";
import { Button, LoadError, Page } from "@o360/ui";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { NavLink, Route, Routes } from "react-router";
import { Directory } from "./Directory";
import { MemberForm } from "./MemberForm";
import { OrgChart } from "./OrgChart";
import { Profile } from "./Profile";

export default function StaffDesk() {
  const can = useCan();
  const people = useResource<Member[]>("/people", "people.");
  const [adding, setAdding] = useState(false);
  const all = people.data ?? [];

  return (
    <Routes>
      <Route path=":id" element={<Profile people={all} />} />
      <Route
        path="*"
        element={
          <Page
            title="StaffDesk"
            subtitle={all.length ? `${all.filter((m) => m.status !== "offboarded").length} current staff` : undefined}
            actions={can("people.member.create") && <Button onClick={() => setAdding(true)}><Plus className="size-4" strokeWidth={2.5} />Add person</Button>}
          >
            <Tabs />
            {people.error ? <LoadError message={people.error.message} retry={people.reload} /> : (
              <Routes>
                <Route index element={<Directory people={all} loading={people.loading} />} />
                <Route path="org" element={<OrgChart people={all} />} />
              </Routes>
            )}
            {adding && <MemberForm people={all} onClose={() => setAdding(false)} />}
          </Page>
        }
      />
    </Routes>
  );
}

function Tabs() {
  const tabs = [{ to: "/staff", label: "Directory", end: true }, { to: "/staff/org", label: "Org chart", end: false }];
  return (
    <nav aria-label="StaffDesk views" className="mb-5 flex gap-1 border-b border-line">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className="relative px-3 pb-2.5 text-[14px]">
          {({ isActive }) => (
            <>
              <span className={isActive ? "font-semibold text-accent" : "text-muted hover:text-ink"}>{t.label}</span>
              {isActive && <motion.span layoutId="staff-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
