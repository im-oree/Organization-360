import type { AutomationRule } from "@o360/contracts";
import type { Bus } from "./bus";
import { SYSTEM, type CommandRunner } from "./commands";

/** `map` returns the command input, or a list of inputs to run the command once per item. */
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
      const mapped = rule.map(event.payload);
      const inputs = Array.isArray(mapped) ? mapped : [mapped];
      for (const [i, input] of inputs.entries()) {
        try {
          await commands.run(rule.run, input, { ...SYSTEM, name: `Automation · ${rule.title}` }, `${rule.id}:${event.id}:${i}`);
        } catch {
          status = "error";
        }
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
