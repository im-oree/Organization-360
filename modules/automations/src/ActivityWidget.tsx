import type { RunRecord } from "@o360/contracts";
import { useResource } from "@o360/platform";
import { WidgetFrame } from "@o360/ui";

const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
};
const describe = (c: string) => c.split(".").slice(1).reverse().join(" ").replace(/-/g, " ");

export default function ActivityWidget() {
  const { data = [] } = useResource<RunRecord[]>("/runs", "");
  return (
    <WidgetFrame title="Recent activity" to="/admin/automations" action="All activity">
      <ul className="pb-2">
        {data.slice(0, 7).map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
            <span className={`size-1.5 shrink-0 rounded-full ${r.status === "ok" ? "bg-success" : "bg-danger"}`} aria-label={r.status === "ok" ? "Done" : "Failed"} />
            <span className="min-w-0 flex-1 truncate"><span className="font-medium">{r.actor}</span> <span className="text-muted">· {describe(r.command)}</span></span>
            <span className="shrink-0 text-[12px] text-muted">{ago(r.at)}</span>
          </li>
        ))}
        {data.length === 0 && <li className="px-4 py-6 text-center text-[14px] text-muted">Nothing yet.</li>}
      </ul>
    </WidgetFrame>
  );
}
