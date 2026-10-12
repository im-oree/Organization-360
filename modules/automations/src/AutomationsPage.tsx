import type { AutomationRule, RunRecord } from "@o360/contracts";
import { api, useResource } from "@o360/platform";
import { Card, Empty, Page } from "@o360/ui";
import { motion } from "motion/react";

export default function AutomationsPage() {
  const { data: rules = [], reload } = useResource<AutomationRule[]>("/automations");
  const { data: runs = [] } = useResource<RunRecord[]>("/runs", "");

  return (
    <Page title="Automations">
      <Card className="mb-10 overflow-hidden">
        {rules.length === 0 ? <Empty>No rules</Empty> : rules.map((r) => (
          <div key={r.id} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{r.title}</p>
              <p className="truncate font-mono text-[12px] text-muted">{r.on} → {r.run}</p>
            </div>
            <Switch on={r.enabled} onChange={(enabled) => api.post(`/automations/${r.id}`, { enabled }).then(reload)} label={r.title} />
          </div>
        ))}
      </Card>

      <h2 className="mb-3 text-[20px] font-semibold tracking-tight">Recent runs</h2>
      <Card className="overflow-hidden">
        {runs.length === 0 ? <Empty>Nothing yet</Empty> : (
          <table className="w-full text-[14px]">
            <tbody>
              {runs.slice(0, 30).map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 pl-4 pr-2"><span className={`inline-block size-2 rounded-full ${r.status === "ok" ? "bg-success" : "bg-danger"}`} /></td>
                  <td className="py-2.5 pr-2 font-mono text-[13px]">{r.command}</td>
                  <td className="hidden py-2.5 pr-2 text-muted sm:table-cell">{r.actor}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted">{r.ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Page>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-fill"}`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 34 }} className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow ${on ? "right-[2px]" : "left-[2px]"}`} />
    </button>
  );
}
