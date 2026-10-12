import type { ComponentType, LazyExoticComponent } from "react";

export type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

/** Frontend half of a module. The shell builds navigation, routes and the launcher from these. */
export type ModuleManifest = {
  id: string;
  title: string;
  /** One line shown on the launcher card. */
  summary: string;
  path: string;
  icon: Icon;
  /** "workspace" for everyone's daily apps, "admin" for the backoffice. */
  area: "workspace" | "admin";
  /** Permission needed to see the module at all. */
  permission?: string;
  page: LazyExoticComponent<ComponentType>;
  /** Hidden from the launcher (e.g. Home itself). */
  launcher?: boolean;
  notify?: Partial<Record<string, (payload: any) => string>>;
  order?: number;
};

export const defineModule = (m: ModuleManifest) => m;

let installed: ModuleManifest[] = [];
/** The shell registers installed modules once; any module can then list its siblings (e.g. the launcher). */
export const registerModules = (list: ModuleManifest[]) => void (installed = list);
export const useModules = () => installed;
