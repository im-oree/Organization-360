import automations from "@o360/module-automations";
import home from "@o360/module-home";
import people from "@o360/module-people";

/** Installed apps. Add or remove a line to plug a module in or out. */
export const modules = [home, people, automations].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
