import { z } from "zod";

/** Permission keys are `<app>.<resource>.<action>`; wildcards are `*` or `app.*`. */
export const Permission = z.string().regex(/^(\*|[a-z0-9-]+(\.[a-z0-9-]+){0,2}(\.\*)?)$/);

export const Role = z.object({
  id: z.string(),
  name: z.string().min(1),
  permissions: z.array(Permission),
  system: z.boolean().default(false),
});
export type Role = z.infer<typeof Role>;

export const User = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  roleIds: z.array(z.string()),
  status: z.enum(["active", "suspended"]),
  mustChangePassword: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type User = z.infer<typeof User>;

/** What the client receives for the signed-in user. Permissions are resolved server-side. */
export type Me = User & { permissions: string[] };

export const Login = z.object({ email: z.email(), password: z.string().min(1) });

/** Fail-closed permission check shared by server and client. */
export function can(granted: readonly string[], key: string) {
  for (const g of granted) {
    if (g === "*" || g === key) return true;
    if (g.endsWith(".*") && key.startsWith(g.slice(0, -1))) return true;
  }
  return false;
}
