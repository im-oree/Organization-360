import { defineModule } from "@o360/platform";
import { Users } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "people",
  title: "Staff",
  summary: "Directory of everyone in the organization",
  path: "/staff",
  icon: Users,
  area: "workspace",
  permission: "people.member.view",
  order: 2,
  page: lazy(() => import("./PeoplePage")),
  notify: { "people.member.created": (m) => `${m.name} joined` },
});
