import type { Member } from "@o360/contracts";
import { useCan, useResource } from "@o360/platform";
import { Button, LoadError, Page } from "@o360/ui";
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Route, Routes } from "react-router";
import { Directory } from "./Directory";
import { MemberForm } from "./MemberForm";
import { OrgChart } from "./OrgChart";
import { Profile } from "./Profile";

export default function StaffDesk() {
  const people = useResource<Member[]>("/people", "people.");
  const all = people.data ?? [];
  const list = (status: "current" | "onboarding" | "offboarded") => <Directory people={all} loading={people.loading} status={status} />;

  const view = (title: string, body: ReactNode) => (
    <View title={title} people={all} error={people.error} retry={people.reload}>{body}</View>
  );

  return (
    <Routes>
      <Route index element={view("Directory", list("current"))} />
      <Route path="onboarding" element={view("Onboarding", list("onboarding"))} />
      <Route path="former" element={view("Former staff", list("offboarded"))} />
      <Route path="org" element={view("Org chart", <OrgChart people={all} />)} />
      <Route path=":id" element={<Profile people={all} />} />
    </Routes>
  );
}

function View({ title, people, error, retry, children }: { title: string; people: Member[]; error: Error | null; retry: () => void; children: ReactNode }) {
  const can = useCan();
  const [adding, setAdding] = useState(false);
  const current = people.filter((m) => m.status !== "offboarded").length;
  return (
    <Page
      title={title}
      subtitle={title === "Directory" && current ? `${current} current staff` : undefined}
      actions={can("people.member.create") && <Button onClick={() => setAdding(true)}><Plus className="size-4" strokeWidth={2.5} />Add person</Button>}
    >
      {error ? <LoadError message={error.message} retry={retry} /> : children}
      {adding && <MemberForm people={people} onClose={() => setAdding(false)} />}
    </Page>
  );
}
