import { can, CommandSchemas, type CommandInput, type CommandName, type RunRecord } from "@o360/contracts";
import { ZodError } from "zod";
import type { Bus } from "./bus";
import type { Collection } from "./store";

export type Actor = { id: string; name: string; permissions: string[] };
export const SYSTEM: Actor = { id: "system", name: "System", permissions: ["*"] };

export type Ctx = { actor: Actor; bus: Bus };
export type Handler<N extends CommandName> = (input: CommandInput<N>, ctx: Ctx) => unknown | Promise<unknown>;
export type Handlers = { [N in CommandName]?: Handler<N> };

export class CommandError extends Error {
  constructor(message: string, readonly status = 400, readonly fields?: Record<string, string>) {
    super(message);
  }
}

/**
 * Runs any command with permission check, validation, idempotency and an audit record.
 * A command's name is its permission key, except self-service commands any signed-in user may run.
 */
export function commandRunner(bus: Bus, audit: Collection<RunRecord>) {
  const handlers: Handlers = {};
  const selfService = new Set<string>();
  const done = new Map<string, unknown>();

  function register(h: Handlers, self: string[] = []) {
    for (const name of Object.keys(h) as CommandName[]) {
      if (handlers[name]) throw new Error(`Command ${name} registered twice`);
      (handlers as Record<string, unknown>)[name] = h[name];
    }
    self.forEach((s) => selfService.add(s));
  }

  async function run(name: string, raw: unknown, actor: Actor, idempotencyKey?: string) {
    const key = idempotencyKey && `${actor.id}:${idempotencyKey}`;
    if (key && done.has(key)) return done.get(key);
    const handler = handlers[name as CommandName] as Handler<CommandName> | undefined;
    if (!handler) throw new CommandError("That action isn't available. Refresh the page and try again.", 404);
    const started = performance.now();
    const record: RunRecord = { id: crypto.randomUUID(), command: name, actor: actor.name, status: "ok", at: new Date().toISOString(), ms: 0 };
    try {
      if (!selfService.has(name) && !can(actor.permissions, name)) throw new CommandError("Your role doesn't allow this. Ask an administrator if you need it.", 403);
      const input = CommandSchemas[name as CommandName].parse(raw);
      const result = await handler(input as never, { actor, bus });
      if (key) done.set(key, result);
      return result;
    } catch (e) {
      record.status = "error";
      record.error = e instanceof CommandError ? e.message : e instanceof ZodError ? "Some details were missing or invalid." : "Unexpected server error.";
      throw e;
    } finally {
      record.ms = Math.round(performance.now() - started);
      audit.put(record);
    }
  }

  return { register, run, list: () => Object.keys(handlers) };
}
export type CommandRunner = ReturnType<typeof commandRunner>;
