import { defineModule } from "@o360/platform";
import { House } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "home",
  title: "Home",
  summary: "Everything that needs you, in one place",
  path: "/",
  icon: House,
  area: "workspace",
  launcher: false,
  order: 1,
  page: lazy(() => import("./HomePage")),
  widgets: [{ id: "tasks", title: "Tasks", span: 2, permission: "tasks.task.view", order: 10, component: lazy(() => import("./TasksWidget")) }],
  notify: { "tasks.task.created": (t) => (t.source === "automation" ? `New task: ${t.title}` : "") },
});
