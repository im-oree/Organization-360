import type { ComponentType, LazyExoticComponent } from "react";

/** Frontend half of a module. The shell builds navigation and routes from these. */
export type ModuleManifest = {
  id: string;
  title: string;
  path: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  page: LazyExoticComponent<ComponentType>;
  /** Event prefixes this module wants surfaced as notifications. */
  notify?: Partial<Record<string, (payload: any) => string>>;
  order?: number;
};

export const defineModule = (m: ModuleManifest) => m;
