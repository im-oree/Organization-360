import { defineModule } from "@o360/platform";
import { Users } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "people",
  title: "StaffDesk",
  summary: "Directory, org chart, onboarding and ID cards",
  path: "/staff",
  icon: Users,
  area: "workspace",
  permission: "people.member.view",
  order: 2,
  page: lazy(() => import("./StaffDesk")),
  notify: { "people.member.created": (m) => `${m.name} was added and their onboarding checklist is ready` },
});
