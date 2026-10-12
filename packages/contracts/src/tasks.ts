import { z } from "zod";

export const Task = z.object({
  id: z.string(),
  title: z.string().min(1),
  done: z.boolean(),
  source: z.string(),
  createdAt: z.iso.datetime(),
});
export type Task = z.infer<typeof Task>;
