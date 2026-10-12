import { z } from "zod";
import { Role } from "./identity";
import { NewMember } from "./people";

/**
 * Command catalogue. Every state change in the platform is a command.
 * UI buttons, API calls, automation rules and AI agents all run the same command,
 * so anything a person can do can be automated with identical validation and audit.
 */
export const CommandSchemas = {
  "people.member.create": NewMember,
  "people.member.remove": z.object({ id: z.string() }),
  "tasks.task.create": z.object({ title: z.string().min(1), source: z.string().default("manual") }),
  "tasks.task.toggle": z.object({ id: z.string() }),
  "identity.user.create": z.object({ name: z.string().min(1), email: z.email(), password: z.string().min(8), roleIds: z.array(z.string()) }),
  "identity.user.update": z.object({ id: z.string(), roleIds: z.array(z.string()).optional(), status: z.enum(["active", "suspended"]).optional() }),
  "identity.role.save": Role.partial({ id: true, system: true }),
  "identity.password.change": z.object({ current: z.string(), next: z.string().min(8) }),
} as const;

export type CommandName = keyof typeof CommandSchemas;
export type CommandInput<N extends CommandName> = z.infer<(typeof CommandSchemas)[N]>;

export const CommandRequest = z.object({
  name: z.string(),
  input: z.unknown(),
  /** Same key → same result, never run twice. Makes retries and automations safe. */
  idempotencyKey: z.string().optional(),
});

export type RunRecord = {
  id: string;
  command: string;
  actor: string;
  status: "ok" | "error";
  at: string;
  ms: number;
  error?: string;
};

/** When an event fires, run a command with input mapped from the event. */
export type AutomationRule = {
  id: string;
  title: string;
  enabled: boolean;
  on: string;
  run: string;
};
