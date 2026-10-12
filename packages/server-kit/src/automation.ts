import type { AutomationRule } from "@o360/contracts";
import type { Bus } from "./bus";
import { SYSTEM, type CommandRunner } from "./commands";

export type Rule = AutomationRule & { map: (payload: any) => unknown };

/**
 * Event → command automation. Each run uses the event id as its idempotency key,
 * so a redelivered event never runs the same automation twice.
 */
export function automations(bus: Bus, commands: CommandRunner) {
  const rules = new Map<string, Rule>();

  bus.subscribe(async (event) => {
    for (const rule of rules.values()) {
      if (!rule.enabled || rule.on !== event.name) continue;
      let status: "ok" | "error" = "ok";
      try {
        await commands.run(rule.run, rule.map(event.payload), { ...SYSTEM, name: `Automation · ${rule.title}` }, `${rule.id}:${event.id}`);
      } catch {
        status = "error";
      }
      bus.publish("automation.run.completed", { rule: rule.id, command: rule.run, status });
    }
  });

  return {
    add: (rule: Rule) => rules.set(rule.id, rule),
    toggle: (id: string, enabled: boolean) => {
      const r = rules.get(id);
      if (r) r.enabled = enabled;
      return r;
    },
    list: (): AutomationRule[] => [...rules.values()].map(({ map: _, ...r }) => r),
  };
}
export type Automations = ReturnType<typeof automations>;
