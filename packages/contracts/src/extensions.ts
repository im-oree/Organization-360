import { z } from "zod";

/**
 * One field schema for everything configurable: extension fields on records,
 * extension settings, and later custom fields and form builders.
 */
export const FieldDef = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
  label: z.string(),
  type: z.enum(["text", "url", "email", "tel", "select"]),
  hint: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  /** Shown on the record as a link built from the value, e.g. "https://github.com/{value}". */
  linkTemplate: z.string().optional(),
  max: z.number().optional(),
});
export type FieldDef = z.infer<typeof FieldDef>;

export type PermissionDef = { key: string; label: string };

/** What every installed app declares about itself. Drives the role editor and the apps page. */
export type AppDef = { id: string; title: string; permissions: PermissionDef[] };

/** An optional add-on to an app: extra fields, settings and permissions, switched on per organization. */
export type ExtensionDef = {
  id: string;
  app: string;
  title: string;
  summary: string;
  /** Extra fields stored on each record of the app, under record.ext[extensionId]. */
  fields: FieldDef[];
  /** Organization-wide settings for the extension. */
  settings: FieldDef[];
  permissions?: PermissionDef[];
};

export type ExtensionState = { id: string; enabled: boolean; settings: Record<string, string> };

/** `values` holds the saved settings; `settings` stays the list of setting definitions. */
export type Catalogue = { apps: AppDef[]; extensions: (ExtensionDef & { enabled: boolean; values: Record<string, string> })[] };

/** Per-record extension values: { [extensionId]: { [fieldKey]: value } }. */
export const ExtValues = z.record(z.string(), z.record(z.string(), z.string()));
export type ExtValues = z.infer<typeof ExtValues>;
