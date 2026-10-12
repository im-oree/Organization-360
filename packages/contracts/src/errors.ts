import type { z } from "zod";

/** Error body every endpoint returns. `error` is always a plain sentence a person can act on. */
export type ApiErrorBody = { error: string; fields?: Record<string, string> };

const label = (path: PropertyKey[]) => {
  const k = String(path[path.length - 1] ?? "This field");
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
};

/** Turns validation issues into one plain-English message per field. */
export function friendlyIssues(issues: z.core.$ZodIssue[]): ApiErrorBody {
  const fields: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.join(".") || "form";
    if (fields[key]) continue;
    const name = label(i.path);
    const isText = "origin" in i && i.origin === "string";
    fields[key] =
      i.code === "invalid_format" && "format" in i && i.format === "email" ? "Enter an email address like name@company.com."
      : i.code === "too_small" && isText && i.minimum === 1 ? `${name} is needed.`
      : i.code === "too_small" && isText ? `${name} needs at least ${i.minimum} characters.`
      : i.code === "too_big" && isText ? `${name} can be at most ${i.maximum} characters.`
      : i.code === "invalid_type" && i.input === undefined ? `${name} is needed.`
      : `${name} doesn't look right.`;
  }
  const count = Object.keys(fields).length;
  return { error: count === 1 ? Object.values(fields)[0]! : `${count} details need a quick fix.`, fields };
}
