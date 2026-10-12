import { can } from "@o360/contracts";
import type { Context, Hono, MiddlewareHandler } from "hono";
import type { AppDef, ExtensionDef } from "@o360/contracts";
import type { Rule } from "./automation";
import type { Bus } from "./bus";
import { CommandError, type Actor, type Handlers } from "./commands";

export * from "./bus";
export * from "./commands";
export * from "./automation";
export * from "./store";
export * from "./extensions";

export type Env = { Variables: { actor: Actor } };

/** Route guard: 401 when signed out, 403 when the permission is missing. */
export const guard =
  (permission: string): MiddlewareHandler<Env> =>
  async (c, next) => {
    const actor = c.get("actor");
    if (!actor) throw new CommandError("Your session has ended. Sign in again to continue.", 401);
    if (!can(actor.permissions, permission)) throw new CommandError("Your role doesn't include this area. Ask an administrator if you need it.", 403);
    await next();
  };

/** Any signed-in user. */
export const signedIn: MiddlewareHandler<Env> = async (c, next) => {
  if (!c.get("actor")) throw new CommandError("Your session has ended. Sign in again to continue.", 401);
  await next();
};

export const actorOf = (c: Context<Env>) => c.get("actor");

/** Backend half of a module: read routes, commands it owns, automations it ships. */
export type ServerModule = {
  id: string;
  /** Title and grantable permissions. Feeds the role editor; no central list to maintain. */
  app?: Omit<AppDef, "id">;
  /** Optional add-ons other teams can switch on without code changes. */
  extensions?: ExtensionDef[];
  routes?: (app: Hono<Env>, deps: { bus: Bus }) => void;
  commands?: Handlers;
  /** Commands any signed-in user may run on their own behalf. */
  selfService?: string[];
  rules?: Rule[];
};
export const defineServerModule = (m: ServerModule) => m;
export * from "./handles";
