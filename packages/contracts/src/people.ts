import { z } from "zod";

export const MemberStatus = z.enum(["onboarding", "active", "offboarded"]);

export const Member = z.object({
  id: z.string(),
  staffNo: z.string(),
  name: z.string().min(1).max(120),
  email: z.email(),
  phone: z.string().max(40).default(""),
  title: z.string().min(1).max(120),
  department: z.string().min(1).max(80),
  location: z.string().max(80).default(""),
  managerId: z.string().nullable().default(null),
  status: MemberStatus.default("onboarding"),
  startDate: z.iso.date(),
  joinedAt: z.iso.datetime(),
});
export type Member = z.infer<typeof Member>;

const editable = {
  name: z.string().min(1).max(120),
  email: z.email(),
  title: z.string().min(1).max(120),
  department: z.string().min(1).max(80),
  phone: z.string().max(40),
  location: z.string().max(80),
  managerId: z.string().nullable(),
  startDate: z.iso.date(),
};

/** Fields a person can provide when adding someone. */
export const NewMember = z.object({
  ...editable,
  phone: editable.phone.default(""),
  location: editable.location.default(""),
  managerId: editable.managerId.default(null),
  startDate: editable.startDate.optional(),
});
export type NewMember = z.infer<typeof NewMember>;

/** Only the fields sent are changed. */
export const MemberPatch = z.object(editable).partial().extend({ id: z.string() });

/** Public result of scanning an ID card. Deliberately minimal. */
export type IdVerification = { valid: boolean; name?: string; title?: string; department?: string; staffNo?: string; organization?: string };
