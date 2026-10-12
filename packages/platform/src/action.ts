import { notify } from "@o360/ui";
import { useCallback, useState } from "react";
import { ApiError } from "./api";

type Options<R> = { success?: string | ((r: R) => string); undo?: (r: R) => Promise<unknown> | void };

/**
 * Runs an async action with a busy flag, field errors and a notification on every outcome.
 * Nothing a user triggers can fail silently.
 */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, opts: Options<R> = {}) {
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});

  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setBusy(true);
      setFields({});
      try {
        const r = await fn(...args);
        const msg = typeof opts.success === "function" ? opts.success(r) : opts.success;
        if (msg) notify.success(msg, opts.undo ? { action: { label: "Undo", run: () => void opts.undo!(r) } } : undefined);
        return r;
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError("Something unexpected happened. Try again, and tell us if it keeps happening.", 0);
        setFields(err.fields);
        if (err.status !== 401) notify.error(err.message);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  );
  return { run, busy, fields, setFields };
}

/** Last line of defence: any unhandled failure still tells the person something went wrong. */
export function catchUnhandled() {
  window.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
    notify.error(e.reason instanceof ApiError ? e.reason.message : "Something unexpected happened. Try again, and tell us if it keeps happening.");
  });
  window.addEventListener("error", () => notify.error("Part of the page stopped working. Refresh to fix it."));
}
