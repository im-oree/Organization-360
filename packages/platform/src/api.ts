import type { ApiErrorBody, CommandName, CommandSchemas } from "@o360/contracts";
import type { z } from "zod";

const base = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "/api";

/** Every failure becomes an ApiError with a plain-English message and optional per-field messages. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

const unauthorized = new Set<() => void>();
/** Called when the server says the session is over, so the shell can show sign-in. */
export const onUnauthorized = (fn: () => void) => (unauthorized.add(fn), () => void unauthorized.delete(fn));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(base + path, { credentials: "include", ...init, headers: { "content-type": "application/json", ...init?.headers } });
  } catch {
    throw new ApiError("We can't reach the server. Check your internet connection, then try again.", 0);
  }
  const body = (await res.json().catch(() => null)) as (ApiErrorBody & T) | null;
  if (res.ok) return body as T;
  if (res.status === 401 && !path.startsWith("/auth/login")) unauthorized.forEach((f) => f());
  const fallback = res.status >= 500 ? "Something went wrong on our side, so nothing was saved. Try again in a moment." : "That didn't work. Refresh the page and try again.";
  throw new ApiError(body?.error ?? fallback, res.status, body?.fields);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  /** Runs a platform command. Typed by the shared command catalogue. */
  run: <N extends CommandName, R = unknown>(name: N, input: z.input<(typeof CommandSchemas)[N]>, idempotencyKey?: string) =>
    request<R>("/commands", { method: "POST", body: JSON.stringify({ name, input, idempotencyKey }) }),
};

export const eventsUrl = `${base}/events`;
