import { defineModule } from "@o360/platform";
import { Blocks } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "apps",
  title: "Apps & extensions",
  summary: "Installed apps and the add-ons switched on for them",
  path: "/admin/apps",
  icon: Blocks,
  area: "admin",
  permission: "platform.extension.save",
  order: 65,
  page: lazy(() => import("./AppsPage")),
});
