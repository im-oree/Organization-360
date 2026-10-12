import type { AutomationRule, RunRecord } from "@o360/contracts";
import { api, useAction, useCan, useResource } from "@o360/platform";
import { Card, Chip, Empty, LoadError, Page } from "@o360/ui";
import { motion } from "motion/react";

export default function AutomationsPage() {
  const can = useCan();
  const { data: rules = [], reload, error } = useResource<AutomationRule[]>("/automations");
  const { data: runs = [], error: runsError, reload: reloadRuns } = useResource<RunRecord[]>("/runs", "");
  const toggle = useAction((id: string, enabled: boolean) => api.post(`/automations/${id}`, { enabled }).then(reload), { success: "Automation updated" });

  return (
    <Page title="Automations" subtitle="When something happens, run something else.">
      <Card className="mb-10 overflow-hidden">
        {error ? <LoadError message={error.message} retry={reload} /> : rules.length === 0 ? <Empty>No automations yet.</Empty> : rules.map((r) => (
          <div key={r.id} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">{r.title}</p>
              <p className="truncate font-mono text-[12px] text-muted">{r.on} → {r.run}</p>
            </div>
            <Switch on={r.enabled} disabled={!can("automation.rule.toggle") || toggle.busy} onChange={(enabled) => toggle.run(r.id, enabled)} label={r.title} />
          </div>
        ))}
      </Card>

      <h2 className="mb-3 text-[17px] font-bold text-accent">Activity</h2>
      <Card className="overflow-hidden">
        {runsError ? <LoadError message={runsError.message} retry={reloadRuns} /> : runs.length === 0 ? <Empty>Nothing has run yet.</Empty> : (
          <table className="w-full text-[14px]">
            <tbody>
              {runs.slice(0, 30).map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 pl-4 pr-2">{r.status === "ok" ? <Chip tone="green">Done</Chip> : <Chip tone="red">Failed</Chip>}</td>
                  <td className="py-2.5 pr-2 font-mono text-[13px]">{r.command}</td>
                  <td className="hidden py-2.5 pr-2 text-muted sm:table-cell">{r.actor}</td>
                  <td className="hidden py-2.5 pr-2 text-muted md:table-cell" title={r.error}>{r.error ?? ""}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted">{new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Page>
  );
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-line"} disabled:opacity-50`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 34 }} className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow ${on ? "right-[2px]" : "left-[2px]"}`} />
    </button>
  );
}
