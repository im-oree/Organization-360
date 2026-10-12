import { defineModule } from "@o360/platform";
import { House } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "home",
  title: "Home",
  path: "/",
  icon: House,
  order: 1,
  page: lazy(() => import("./HomePage")),
  notify: { "tasks.task.created": (t) => (t.source === "automation" ? `New task: ${t.title}` : "") },
});
