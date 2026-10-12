import { can, type PlatformEvent, type Signal } from "@o360/contracts";
import type { Actor, Bus, ServerModule } from "@o360/server-kit";
import type { WSContext } from "hono/ws";

type Conn = { ws: WSContext; token: string };

/**
 * Real-time hub. Each socket belongs to a signed-in person; every event is checked
 * against its audience or the owning module's view permission before it's sent.
 * The actor is re-resolved per delivery, so revoked access stops events immediately.
 */
export function socketHub(bus: Bus, modules: ServerModule[], authenticate: (token: string) => Actor | undefined) {
  const conns = new Set<Conn>();
  const visibility = Object.entries(Object.assign({}, ...modules.map((m) => m.visibility ?? {})) as Record<string, string>).sort((a, b) => b[0].length - a[0].length);
  const signals = Object.assign({}, ...modules.map((m) => m.signals ?? {})) as NonNullable<ServerModule["signals"]>;

  function mayReceive(actor: Actor, e: PlatformEvent) {
    if (e.audience) return e.audience.includes(actor.id);
    const rule = visibility.find(([prefix]) => e.name.startsWith(prefix));
    if (!rule) return can(actor.permissions, "*");
    return rule[1] === "" || can(actor.permissions, rule[1]);
  }

  function sendTo(filter: (a: Actor) => boolean, data: string) {
    for (const c of conns) {
      const actor = authenticate(c.token);
      if (!actor) {
        c.ws.close(4401, "Session ended");
        conns.delete(c);
        continue;
      }
      if (filter(actor)) c.ws.send(data);
    }
  }

  bus.subscribe((e) => {
    const { audience: _, ...wire } = e;
    sendTo((a) => mayReceive(a, e), JSON.stringify({ type: "event", event: wire }));
  });

  return {
    open(ws: WSContext, token: string) {
      conns.add({ ws, token });
    },
    close(ws: WSContext) {
      for (const c of conns) if (c.ws === ws) conns.delete(c);
    },
    message(ws: WSContext, raw: string) {
      const conn = [...conns].find((c) => c.ws === ws);
      const actor = conn && authenticate(conn.token);
      if (!actor) return;
      let msg: { type?: string; name?: string; payload?: unknown };
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (msg.type === "ping") return ws.send(JSON.stringify({ type: "pong" }));
      if (msg.type !== "signal" || !msg.name) return;
      const out = signals[msg.name]?.(msg.payload, actor);
      if (!out) return;
      const signal: Signal = { type: "signal", name: msg.name, from: actor.id, payload: out.payload };
      sendTo((a) => a.id !== actor.id && out.audience.includes(a.id), JSON.stringify(signal));
    },
    count: () => conns.size,
  };
}
