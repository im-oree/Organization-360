import type { CommandName, CommandSchemas, EventName } from "@o360/contracts";
import type { z } from "zod";

const base = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError((body as { error?: string })?.error ?? res.statusText, res.status, body);
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  /** Runs a platform command. Typed by the shared command catalogue. */
  run: <N extends CommandName, R = unknown>(name: N, input: z.input<(typeof CommandSchemas)[N]>, idempotencyKey?: string) =>
    request<R>("/commands", { method: "POST", body: JSON.stringify({ name, input, idempotencyKey }) }),
};

export const eventsUrl = `${base}/events`;
export type { EventName };
