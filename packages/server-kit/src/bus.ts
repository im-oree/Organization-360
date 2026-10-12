import { EventSchemas, type EventName, type EventPayload, type PlatformEvent } from "@o360/contracts";

type Listener = (event: PlatformEvent) => void | Promise<void>;

/**
 * Event bus interface. The in-memory adapter runs everything in one process;
 * a NATS or Redis adapter with the same shape lets modules run as separate services.
 */
export interface Bus {
  publish<N extends EventName>(name: N, payload: EventPayload<N>): PlatformEvent<N>;
  subscribe(listener: Listener): () => void;
  recent(limit?: number): PlatformEvent[];
}

export function memoryBus(history = 200): Bus {
  const listeners = new Set<Listener>();
  const log: PlatformEvent[] = [];
  return {
    publish(name, payload) {
      const event = {
        id: crypto.randomUUID(),
        name,
        at: new Date().toISOString(),
        payload: EventSchemas[name].parse(payload),
      } as PlatformEvent<typeof name>;
      log.unshift(event);
      log.length = Math.min(log.length, history);
      for (const l of listeners) queueMicrotask(() => void l(event));
      return event;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    recent: (limit = 50) => log.slice(0, limit),
  };
}
