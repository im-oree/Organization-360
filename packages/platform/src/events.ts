import type { EventName, PlatformEvent } from "@o360/contracts";
import { useEffect, useRef } from "react";
import { eventsUrl } from "./api";

type Listener = (e: PlatformEvent) => void;
const listeners = new Set<Listener>();
let source: EventSource | null = null;

function connect() {
  if (source || typeof EventSource === "undefined") return;
  source = new EventSource(eventsUrl);
  source.addEventListener("event", (m) => {
    const e = JSON.parse((m as MessageEvent).data) as PlatformEvent;
    listeners.forEach((l) => l(e));
  });
}

/** Subscribe to live platform events. Pass names to filter, or a prefix like "people.". */
export function useEvents(match: EventName[] | string | null, handler: Listener) {
  const ref = useRef(handler);
  ref.current = handler;
  const key = Array.isArray(match) ? match.join(",") : match;
  useEffect(() => {
    if (match === null) return;
    connect();
    const l: Listener = (e) => {
      const hit = Array.isArray(match) ? match.includes(e.name) : e.name.startsWith(match);
      if (hit) ref.current(e);
    };
    listeners.add(l);
    return () => void listeners.delete(l);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
