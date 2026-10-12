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
  widgets: [
    { id: "my-id", title: "Your ID", span: 1, order: 20, component: lazy(() => import("./widgets").then((m) => ({ default: m.MyIdWidget }))) },
    { id: "people", title: "People", span: 1, permission: "people.member.view", order: 30, component: lazy(() => import("./widgets").then((m) => ({ default: m.PeopleWidget }))) },
  ],
  notify: { "people.member.created": (m) => `${m.name} was added and their onboarding checklist is ready` },
});
