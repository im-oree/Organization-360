import { defineModule } from "@o360/platform";
import { KeyRound, ShieldCheck } from "lucide-react";
import { lazy } from "react";

export const users = defineModule({
  id: "users",
  title: "Users",
  summary: "Sign-in accounts and who can access what",
  path: "/admin/users",
  icon: KeyRound,
  area: "admin",
  permission: "identity.user.view",
  order: 60,
  page: lazy(() => import("./UsersPage")),
});

export const roles = defineModule({
  id: "roles",
  title: "Roles",
  summary: "Permission sets you assign to users",
  path: "/admin/roles",
  icon: ShieldCheck,
  area: "admin",
  permission: "identity.role.view",
  order: 61,
  page: lazy(() => import("./RolesPage")),
});
