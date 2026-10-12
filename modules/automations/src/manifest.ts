import { defineModule } from "@o360/platform";
import { Zap } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "automations",
  title: "Automations",
  summary: "Rules that run work for you, and the activity log",
  path: "/admin/automations",
  icon: Zap,
  area: "admin",
  permission: "automation.rule.view",
  order: 70,
  page: lazy(() => import("./AutomationsPage")),
  widgets: [{ id: "activity", title: "Recent activity", span: 2, permission: "automation.rule.view", order: 40, component: lazy(() => import("./ActivityWidget")) }],
});
