import { z } from "zod";
import { Member } from "./people";
import { Task } from "./tasks";
import { Role, User } from "./identity";

/**
 * Event catalogue. Every cross-module signal is declared here once.
 * Names follow <module>.<entity>.<verb>.
 */
export const EventSchemas = {
  "people.member.created": Member,
  "people.member.updated": Member,
  "people.member.activated": Member,
  "people.member.offboarded": Member,
  "people.badge.scanned": z.object({ memberId: z.string().nullable(), uid: z.string(), device: z.string(), granted: z.boolean() }),
  "people.member.removed": z.object({ id: z.string() }),
  "tasks.task.created": Task,
  "tasks.task.updated": Task,
  "identity.user.created": User,
  "identity.user.updated": User,
  "identity.role.saved": Role,
  "platform.extension.saved": z.object({ id: z.string(), enabled: z.boolean() }),
  "automation.run.completed": z.object({ rule: z.string(), command: z.string(), status: z.enum(["ok", "error"]) }),
} as const;

export type EventName = keyof typeof EventSchemas;
export type EventPayload<N extends EventName> = z.infer<(typeof EventSchemas)[N]>;

export type PlatformEvent<N extends EventName = EventName> = {
  id: string;
  name: N;
  at: string;
  payload: EventPayload<N>;
};
