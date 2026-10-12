import { defineModule } from "@o360/platform";
import { LayoutGrid } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "home",
  title: "Home",
  summary: "Your apps and tasks",
  path: "/",
  icon: LayoutGrid,
  area: "workspace",
  launcher: false,
  order: 1,
  page: lazy(() => import("./HomePage")),
  notify: { "tasks.task.created": (t) => (t.source === "automation" ? `New task: ${t.title}` : "") },
});
