import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { CommandRequest, friendlyIssues, type RunRecord } from "@o360/contracts";
import { authenticate, SESSION_COOKIE, tokenFrom } from "@o360/module-identity/server";
import { actorOf, automations, commandRunner, CommandError, fileCollection, guard, memoryBus, signedIn, type Env } from "@o360/server-kit";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { streamSSE } from "hono/streaming";
import { ZodError } from "zod";
import { modules } from "./modules";

const root = resolve(import.meta.dirname, "../../..");
const brandDir = process.env.BRAND_DIR ?? resolve(root, "config/brand");
const port = Number(process.env.PORT ?? 4000);

const bus = memoryBus();
const audit = fileCollection<RunRecord>("audit");
const commands = commandRunner(bus, audit);
const rules = automations(bus, commands);
const api = new Hono<Env>();

/** Every request resolves its actor once; routes and commands check permissions against it. */
api.use(async (c, next) => {
  const actor = authenticate(tokenFrom(getCookie(c, SESSION_COOKIE), c.req.header("authorization")));
  if (actor) c.set("actor", actor);
  await next();
});

for (const m of modules) {
  m.routes?.(api, { bus });
  if (m.commands) commands.register(m.commands, m.selfService);
  m.rules?.forEach(rules.add);
}

api.get("/health", (c) => c.json({ ok: true, modules: modules.map((m) => m.id) }));
api.get("/brand", (c) => c.json(JSON.parse(readFileSync(resolve(brandDir, "brand.json"), "utf8"))));

/** One endpoint runs every command. Same path for UI, scripts, rules and AI agents. */
api.post("/commands", async (c) => {
  const req = CommandRequest.parse(await c.req.json());
  const actor = actorOf(c);
  if (!actor) throw new CommandError("Your session has ended. Sign in again to continue.", 401);
  return c.json(await commands.run(req.name, req.input, actor, req.idempotencyKey ?? c.req.header("idempotency-key")));
});
api.get("/commands", guard("automation.rule.view"), (c) => c.json(commands.list()));
api.get("/runs", guard("automation.rule.view"), (c) => c.json(audit.all().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200)));
api.get("/automations", guard("automation.rule.view"), (c) => c.json(rules.list()));
api.post("/automations/:id", guard("automation.rule.toggle"), async (c) => {
  const { enabled } = await c.req.json<{ enabled: boolean }>();
  return rules.toggle(c.req.param("id"), enabled) ? c.json({ ok: true }) : c.json({ error: "That automation no longer exists. Refresh to see the latest." }, 404);
});
api.get("/events/recent", guard("automation.rule.view"), (c) => c.json(bus.recent()));
api.get("/events", signedIn, (c) =>
  streamSSE(c, async (stream) => {
    const off = bus.subscribe((e) => void stream.writeSSE({ data: JSON.stringify(e), event: "event", id: e.id }));
    stream.onAbort(off);
    while (!stream.aborted) await stream.sleep(25_000).then(() => stream.writeSSE({ data: "", event: "ping" }));
  }),
);

api.onError((err, c) => {
  if (err instanceof ZodError) return c.json(friendlyIssues(err.issues), 422);
  if (err instanceof CommandError) return c.json({ error: err.message }, err.status as 400);
  if (err instanceof SyntaxError) return c.json({ error: "The request couldn't be read. Refresh the page and try again." }, 400);
  console.error(err);
  return c.json({ error: "Something went wrong on our side, so nothing was saved. Try again in a moment." }, 500);
});

api.notFound((c) => c.json({ error: "That page or action doesn't exist." }, 404));

const app = new Hono();
app.route("/api", api);
app.use("/brand/*", serveStatic({ root: brandDir, rewriteRequestPath: (p) => p.replace(/^\/brand/, "") }));
if (process.env.NODE_ENV === "production") {
  const dist = resolve(root, "apps/shell/dist");
  app.use("/*", serveStatic({ root: dist }));
  app.get("*", serveStatic({ path: resolve(dist, "index.html") }));
}

serve({ fetch: app.fetch, port }, () => console.log(`gateway → http://localhost:${port}`));
