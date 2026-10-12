import type { ComponentType, LazyExoticComponent } from "react";

export type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

/** Frontend half of a module. The shell builds navigation, routes and the launcher from these. */
/** A Home dashboard card. Any module can contribute; Home shows the ones the person can use. */
export type Widget = {
  id: string;
  title: string;
  /** Grid width: 1 = third, 2 = two thirds, 3 = full row (on desktop). */
  span?: 1 | 2 | 3;
  permission?: string;
  order?: number;
  component: LazyExoticComponent<ComponentType>;
};

/** An app's own navigation. When present, the shell switches to the app's sidebar inside it. */
export type NavItem = { label: string; path: string; icon: Icon; end?: boolean; permission?: string; group?: string };

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
  /** Hidden from the Apps section (e.g. Home itself). */
  launcher?: boolean;
  widgets?: Widget[];
  nav?: NavItem[];
  /** "footer" keeps the module out of the main menu (reached from the user card, e.g. Settings). */
  placement?: "main" | "footer";
  /** Lives in the top bar on every page (e.g. the messages button and panel). */
  topbar?: LazyExoticComponent<ComponentType>;
  notify?: Partial<Record<string, (payload: any) => string>>;
  order?: number;
};

export const defineModule = (m: ModuleManifest) => m;

let installed: ModuleManifest[] = [];
/** The shell registers installed modules once; any module can then list its siblings (e.g. the launcher). */
export const registerModules = (list: ModuleManifest[]) => void (installed = list);
export const useModules = () => installed;
