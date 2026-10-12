import type { EventName, PlatformEvent, Signal } from "@o360/contracts";
import { useEffect, useRef, useSyncExternalStore } from "react";

type Listener = (e: PlatformEvent) => void;
type SignalListener = (s: Signal) => void;
export type Connection = "connecting" | "online" | "offline";

const listeners = new Set<Listener>();
const signalListeners = new Set<SignalListener>();
const reconnectListeners = new Set<() => void>();
const statusListeners = new Set<() => void>();
let socket: WebSocket | null = null;
let status: Connection = "connecting";
let attempts = 0;
let wanted = false;
let everConnected = false;

const setStatus = (s: Connection) => ((status = s), statusListeners.forEach((l) => l()));

function url() {
  const base = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "/api";
  const u = new URL(`${base}/ws`, location.href);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  return u.toString();
}

/** One socket per tab. Reconnects with backoff and tells views to refresh after a gap. */
function connect() {
  if (socket || !wanted || typeof WebSocket === "undefined") return;
  const ws = new WebSocket(url());
  socket = ws;
  ws.onopen = () => {
    attempts = 0;
    setStatus("online");
    if (everConnected) reconnectListeners.forEach((l) => l());
    everConnected = true;
  };
  ws.onmessage = (m) => {
    const msg = JSON.parse(String(m.data));
    if (msg.type === "event") listeners.forEach((l) => l(msg.event));
    else if (msg.type === "signal") signalListeners.forEach((l) => l(msg));
  };
  ws.onclose = (e) => {
    socket = null;
    if (!wanted || e.code === 4401) return setStatus("offline");
    setStatus(attempts > 1 ? "offline" : "connecting");
    setTimeout(connect, Math.min(15000, 500 * 2 ** attempts++));
  };
}

/** Called by the auth layer: open the socket when signed in, close it on sign-out. */
export function setRealtime(on: boolean) {
  wanted = on;
  if (on) connect();
  else socket?.close();
}

export function sendSignal(name: string, payload: unknown) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "signal", name, payload }));
}

export const onReconnect = (fn: () => void) => (reconnectListeners.add(fn), () => void reconnectListeners.delete(fn));
export const onEvent = (fn: Listener) => (listeners.add(fn), () => void listeners.delete(fn));

export function useConnection() {
  return useSyncExternalStore((cb) => (statusListeners.add(cb), () => statusListeners.delete(cb)), () => status);
}

/** Subscribe to live platform events. Pass names to filter, or a prefix like "people.". */
export function useEvents(match: EventName[] | string | null, handler: Listener) {
  const ref = useRef(handler);
  ref.current = handler;
  const key = Array.isArray(match) ? match.join(",") : match;
  useEffect(() => {
    if (match === null) return;
    const l: Listener = (e) => {
      const hit = Array.isArray(match) ? match.includes(e.name) : e.name.startsWith(match);
      if (hit) ref.current(e);
    };
    listeners.add(l);
    return () => void listeners.delete(l);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function useSignal(name: string, handler: SignalListener) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const l: SignalListener = (s) => s.name === name && ref.current(s);
    signalListeners.add(l);
    return () => void signalListeners.delete(l);
  }, [name]);
}
