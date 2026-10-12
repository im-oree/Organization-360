import home from "@o360/module-home/server";
import identity from "@o360/module-identity/server";
import people from "@o360/module-people/server";

/** Backend modules mounted by this gateway. Remove a line to run that module elsewhere. */
export const modules = [identity, home, people];
