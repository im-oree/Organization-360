import type { Member } from "@o360/contracts";
import { useResource } from "@o360/platform";
import { Avatar, Stat, WidgetFrame } from "@o360/ui";
import { Link } from "react-router";
import { IdCard } from "./IdCard";

export function MyIdWidget() {
  const { data, loading } = useResource<Member | null>("/people/me", "people.");
  return (
    <WidgetFrame title="Your ID">
      <div className="px-4 pb-4">
        {loading ? null : data ? <IdCard member={data} /> : <p className="py-6 text-center text-[14px] text-muted">There's no staff record for your email yet. HR can add one in StaffDesk.</p>}
      </div>
    </WidgetFrame>
  );
}

export function PeopleWidget() {
  const { data = [] } = useResource<Member[]>("/people", "people.");
  const current = data.filter((m) => m.status !== "offboarded");
  const onboarding = data.filter((m) => m.status === "onboarding");
  const newest = [...current].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 4);
  return (
    <WidgetFrame title="People" to="/staff" action="Open StaffDesk">
      <div className="grid grid-cols-2 gap-2 px-4">
        <Stat label="Current staff" value={current.length} />
        <Stat label="Onboarding" value={onboarding.length} tone={onboarding.length ? "warn" : undefined} />
      </div>
      <p className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-label">Newest</p>
      <ul className="pb-2">
        {newest.map((m) => (
          <li key={m.id}>
            <Link to={`/staff/${m.id}`} className="flex items-center gap-2.5 px-4 py-2 hover:bg-fill">
              <Avatar name={m.name} size={26} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{m.name}</span>
              <span className="text-[12px] text-muted">{new Date(m.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  );
}
