import { defineModule } from "@o360/platform";
import { Zap } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "automations",
  title: "Automations",
  path: "/automations",
  icon: Zap,
  order: 90,
  page: lazy(() => import("./AutomationsPage")),
});
