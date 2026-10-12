import { defineModule } from "@o360/platform";
import { Blocks, ClipboardCheck, Network, Users, UserX } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "people",
  title: "StaffDesk",
  summary: "Directory, org chart, onboarding and ID cards",
  path: "/staffdesk",
  icon: Users,
  area: "workspace",
  permission: "people.member.view",
  order: 2,
  page: lazy(() => import("./StaffDesk")),
  nav: [
    { label: "Directory", path: "/staffdesk", icon: Users, end: true },
    { label: "Org chart", path: "/staffdesk/org", icon: Network },
    { label: "Onboarding", path: "/staffdesk/onboarding", icon: ClipboardCheck },
    { label: "Former staff", path: "/staffdesk/former", icon: UserX },
    { label: "Extensions", path: "/admin/apps", icon: Blocks, permission: "platform.extension.save", group: "Settings" },
  ],
  widgets: [
    { id: "my-id", title: "Your ID", span: 1, order: 20, component: lazy(() => import("./widgets").then((m) => ({ default: m.MyIdWidget }))) },
    { id: "people", title: "People", span: 1, permission: "people.member.view", order: 30, component: lazy(() => import("./widgets").then((m) => ({ default: m.PeopleWidget }))) },
  ],
  notify: { "people.member.created": (m) => `${m.name} was added and their onboarding checklist is ready` },
});
