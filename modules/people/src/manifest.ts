import { defineModule } from "@o360/platform";
import { Users } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "people",
  title: "People",
  path: "/people",
  icon: Users,
  order: 2,
  page: lazy(() => import("./PeoplePage")),
  notify: { "people.member.created": (m) => `${m.name} joined` },
});
