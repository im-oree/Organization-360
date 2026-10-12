import { z } from "zod";

export const Member = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  title: z.string(),
  department: z.string(),
  joinedAt: z.iso.datetime(),
});
export type Member = z.infer<typeof Member>;

export const NewMember = Member.omit({ id: true, joinedAt: true });
export type NewMember = z.infer<typeof NewMember>;
