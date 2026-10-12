import { defineModule } from "@o360/platform";
import { Bell, Palette, Settings, UserRound } from "lucide-react";
import { lazy } from "react";

export default defineModule({
  id: "settings",
  title: "Settings",
  summary: "Your appearance, notifications and account",
  path: "/settings",
  icon: Settings,
  area: "workspace",
  launcher: false,
  placement: "footer",
  order: 99,
  page: lazy(() => import("./SettingsPage")),
  nav: [
    { label: "Appearance", path: "/settings", icon: Palette, end: true },
    { label: "Notifications", path: "/settings/notifications", icon: Bell },
    { label: "Account", path: "/settings/account", icon: UserRound },
  ],
});
