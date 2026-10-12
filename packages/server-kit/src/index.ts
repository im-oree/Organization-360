import type { Hono } from "hono";
import type { Bus } from "./bus";
import type { Handlers } from "./commands";
import type { Rule } from "./automation";

export * from "./bus";
export * from "./commands";
export * from "./automation";

/** Backend half of a module: read routes, commands it owns, automations it ships. */
export type ServerModule = {
  id: string;
  routes?: (app: Hono, deps: { bus: Bus }) => void;
  commands?: Handlers;
  rules?: Rule[];
};
export const defineServerModule = (m: ServerModule) => m;
export * from "./store";
