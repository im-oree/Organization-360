import { CommandSchemas, type CommandInput, type CommandName, type RunRecord } from "@o360/contracts";
import type { Bus } from "./bus";

export type Ctx = { actor: string; bus: Bus };
export type Handler<N extends CommandName> = (input: CommandInput<N>, ctx: Ctx) => unknown | Promise<unknown>;
export type Handlers = { [N in CommandName]?: Handler<N> };

export class CommandError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** Runs any command with validation, idempotency and an audit record. */
export function commandRunner(bus: Bus) {
  const handlers: Handlers = {};
  const done = new Map<string, unknown>();
  const runs: RunRecord[] = [];

  function register(h: Handlers) {
    for (const name of Object.keys(h) as CommandName[]) {
      if (handlers[name]) throw new Error(`Command ${name} registered twice`);
      (handlers as Record<string, unknown>)[name] = h[name];
    }
  }

  async function run(name: string, raw: unknown, actor: string, idempotencyKey?: string) {
    if (idempotencyKey && done.has(idempotencyKey)) return done.get(idempotencyKey);
    const handler = handlers[name as CommandName] as Handler<CommandName> | undefined;
    if (!handler) throw new CommandError(`Unknown command ${name}`, 404);

    const started = performance.now();
    const record: RunRecord = { id: crypto.randomUUID(), command: name, actor, status: "ok", at: new Date().toISOString(), ms: 0 };
    try {
      const input = CommandSchemas[name as CommandName].parse(raw);
      const result = await handler(input as never, { actor, bus });
      if (idempotencyKey) done.set(idempotencyKey, result);
      return result;
    } catch (e) {
      record.status = "error";
      record.error = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      record.ms = Math.round(performance.now() - started);
      runs.unshift(record);
      runs.length = Math.min(runs.length, 500);
    }
  }

  return { register, run, list: () => Object.keys(handlers), runs: () => runs };
}
export type CommandRunner = ReturnType<typeof commandRunner>;
