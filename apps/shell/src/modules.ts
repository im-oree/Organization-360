import automations from "@o360/module-automations";
import home from "@o360/module-home";
import { roles, users } from "@o360/module-identity";
import people from "@o360/module-people";
import { registerModules } from "@o360/platform";

/** Installed apps. Add or remove a line to plug a module in or out. */
export const modules = [home, people, users, roles, automations].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

registerModules(modules);
