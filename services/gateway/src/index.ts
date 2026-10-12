import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { CommandRequest } from "@o360/contracts";
import { automations, commandRunner, CommandError, memoryBus } from "@o360/server-kit";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { ZodError } from "zod";
import { modules } from "./modules";

const root = resolve(import.meta.dirname, "../../..");
const brandDir = process.env.BRAND_DIR ?? resolve(root, "config/brand");
const port = Number(process.env.PORT ?? 4000);

const bus = memoryBus();
const commands = commandRunner(bus);
const rules = automations(bus, commands);
const api = new Hono();

for (const m of modules) {
  m.routes?.(api, { bus });
  if (m.commands) commands.register(m.commands);
  m.rules?.forEach(rules.add);
}

api.get("/health", (c) => c.json({ ok: true, modules: modules.map((m) => m.id) }));
api.get("/brand", (c) => c.json(JSON.parse(readFileSync(resolve(brandDir, "brand.json"), "utf8"))));

/** One endpoint runs every command. Same path for UI, scripts, rules and AI agents. */
api.post("/commands", async (c) => {
  const req = CommandRequest.parse(await c.req.json());
  const actor = c.req.header("x-actor") ?? "user";
  return c.json(await commands.run(req.name, req.input, actor, req.idempotencyKey ?? c.req.header("idempotency-key")));
});
api.get("/commands", (c) => c.json(commands.list()));
api.get("/runs", (c) => c.json(commands.runs().slice(0, 100)));
api.get("/automations", (c) => c.json(rules.list()));
api.post("/automations/:id", async (c) => {
  const { enabled } = await c.req.json<{ enabled: boolean }>();
  return rules.toggle(c.req.param("id"), enabled) ? c.json({ ok: true }) : c.json({ error: "Not found" }, 404);
});
api.get("/events/recent", (c) => c.json(bus.recent()));
api.get("/events", (c) =>
  streamSSE(c, async (stream) => {
    const off = bus.subscribe((e) => void stream.writeSSE({ data: JSON.stringify(e), event: "event", id: e.id }));
    stream.onAbort(off);
    while (!stream.aborted) await stream.sleep(25_000).then(() => stream.writeSSE({ data: "", event: "ping" }));
  }),
);

api.onError((err, c) => {
  if (err instanceof ZodError) return c.json({ error: "Invalid input", issues: err.issues }, 422);
  if (err instanceof CommandError) return c.json({ error: err.message }, err.status as 400);
  console.error(err);
  return c.json({ error: "Internal error" }, 500);
});

const app = new Hono();
app.route("/api", api);
app.use("/brand/*", serveStatic({ root: brandDir, rewriteRequestPath: (p) => p.replace(/^\/brand/, "") }));
if (process.env.NODE_ENV === "production") {
  const dist = resolve(root, "apps/shell/dist");
  app.use("/*", serveStatic({ root: dist }));
  app.get("*", serveStatic({ path: resolve(dist, "index.html") }));
}

serve({ fetch: app.fetch, port }, () => console.log(`gateway → http://localhost:${port}`));
