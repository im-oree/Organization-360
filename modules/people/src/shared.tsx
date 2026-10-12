import type { Member } from "@o360/contracts";
import { Chip } from "@o360/ui";

export const statusChip = (s: Member["status"]) =>
  s === "active" ? <Chip tone="green">Active</Chip> : s === "onboarding" ? <Chip tone="amber">Onboarding</Chip> : <Chip tone="gray">Offboarded</Chip>;
