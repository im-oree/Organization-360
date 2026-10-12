import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { CommandRequest, friendlyIssues, type AppDef, type Catalogue, type RunRecord } from "@o360/contracts";
import { authenticate, SESSION_COOKIE, tokenFrom } from "@o360/module-identity/server";
import { actorOf, automations, extensions, commandRunner, CommandError, fileCollection, guard, memoryBus, signedIn, type Env } from "@o360/server-kit";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { createNodeWebSocket } from "@hono/node-ws";
import { socketHub } from "./hub";
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

const apps: AppDef[] = [];
for (const m of modules) {
  if (m.app) apps.push({ id: m.id, ...m.app });
  m.extensions?.forEach(extensions.define);
  m.routes?.(api, { bus });
  if (m.commands) commands.register(m.commands, m.selfService);
  m.rules?.forEach(rules.add);
}

/** Platform-owned pieces: the app catalogue and extension switches. */
apps.push({
  id: "platform",
  title: "Platform",
  permissions: [
    { key: "automation.rule.view", label: "View automations and activity" },
    { key: "automation.rule.toggle", label: "Turn automations on or off" },
    { key: "platform.extension.save", label: "Turn extensions on or off" },
  ],
});
commands.register({
  "platform.extension.save"(input, { bus }) {
    const s = extensions.save(input);
    bus.publish("platform.extension.saved", { id: s.id, enabled: s.enabled });
    return s;
  },
});
api.get("/catalogue", signedIn, (c) => {
  const exts = extensions.all();
  const body: Catalogue = {
    apps: apps.map((a) => ({ ...a, permissions: [...a.permissions, ...exts.filter((e) => e.app === a.id && e.enabled).flatMap((e) => e.permissions ?? [])] })),
    extensions: exts,
  };
  return c.json(body);
});

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
api.onError((err, c) => {
  if (err instanceof ZodError) return c.json(friendlyIssues(err.issues), 422);
  if (err instanceof CommandError) return c.json({ error: err.message, fields: err.fields }, err.status as 400);
  if (err instanceof SyntaxError) return c.json({ error: "The request couldn't be read. Refresh the page and try again." }, 400);
  console.error(err);
  return c.json({ error: "Something went wrong on our side, so nothing was saved. Try again in a moment." }, 500);
});

api.notFound((c) => c.json({ error: "That page or action doesn't exist." }, 404));

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
const hub = socketHub(bus, [...modules, { id: "platform", visibility: { "platform.": "", "automation.": "automation.rule.view" } }], (t) => authenticate(t));

/** Real-time channel. Sign-in is checked on connect and on every delivery. */
app.get(
  "/api/ws",
  upgradeWebSocket((c) => {
    const token = tokenFrom(getCookie(c, SESSION_COOKIE), c.req.header("authorization")) ?? "";
    return {
      onOpen: (_e, ws) => (authenticate(token) ? hub.open(ws, token) : ws.close(4401, "Sign in required")),
      onMessage: (e, ws) => hub.message(ws, String(e.data)),
      onClose: (_e, ws) => hub.close(ws),
    };
  }),
);
app.route("/api", api);
app.use("/brand/*", serveStatic({ root: brandDir, rewriteRequestPath: (p) => p.replace(/^\/brand/, "") }));
if (process.env.NODE_ENV === "production") {
  const dist = resolve(root, "apps/shell/dist");
  app.use("/*", serveStatic({ root: dist }));
  app.get("*", serveStatic({ path: resolve(dist, "index.html") }));
}

const server = serve({ fetch: app.fetch, port }, () => console.log(`gateway → http://localhost:${port}`));
injectWebSocket(server);
