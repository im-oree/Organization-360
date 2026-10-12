import type { ExtValues, ExtensionDef, ExtensionState, FieldDef } from "@o360/contracts";
import { CommandError } from "./commands";
import { fileCollection } from "./store";

const defs = new Map<string, ExtensionDef>();
const state = fileCollection<ExtensionState>("extensions");

export const extensions = {
  define: (d: ExtensionDef) => void defs.set(d.id, d),
  all: () => [...defs.values()].map((d) => ({ ...d, enabled: state.get(d.id)?.enabled ?? false, values: state.get(d.id)?.settings ?? {} })),
  enabled: (id: string) => state.get(id)?.enabled ?? false,
  settings: (id: string) => state.get(id)?.settings ?? {},
  save(s: ExtensionState) {
    const d = defs.get(s.id);
    if (!d) throw new CommandError("That extension isn't installed. Refresh the page and try again.", 404);
    return state.put({ ...s, settings: checkFields(d.settings, s.settings, "settings") });
  },
  /** Validates per-record values against each enabled extension of an app. Unknown or disabled keys are dropped. */
  clean(app: string, values: ExtValues = {}, previous: ExtValues = {}) {
    const out: ExtValues = {};
    for (const d of defs.values()) {
      if (d.app !== app) continue;
      if (!extensions.enabled(d.id)) {
        if (previous[d.id]) out[d.id] = previous[d.id]!; // keep data if an extension is switched off
        continue;
      }
      const v = values[d.id] ?? previous[d.id];
      if (v) out[d.id] = checkFields(d.fields, v, d.id);
    }
    return out;
  },
};

const patterns: Partial<Record<FieldDef["type"], [RegExp, string]>> = {
  url: [/^https?:\/\/\S+\.\S+$/, "needs to be a full web address starting with https://"],
  email: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "needs to be an email address like name@company.com"],
  tel: [/^[+\d][\d\s()-]{5,}$/, "needs to be a phone number, digits only with an optional +"],
};

/** Generic validation for any FieldDef list. Messages are plain English and name the field. */
function checkFields(fields: FieldDef[], values: Record<string, string>, scope: string) {
  const out: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = (values[f.key] ?? "").trim();
    if (!v) continue;
    const p = patterns[f.type];
    if (p && !p[0].test(v)) errors[`ext.${scope}.${f.key}`] = `${f.label} ${p[1]}.`;
    else if (f.options && !f.options.includes(v)) errors[`ext.${scope}.${f.key}`] = `${f.label} must be one of: ${f.options.join(", ")}.`;
    else if (v.length > (f.max ?? 300)) errors[`ext.${scope}.${f.key}`] = `${f.label} can be at most ${f.max ?? 300} characters.`;
    else out[f.key] = v;
  }
  const n = Object.keys(errors).length;
  if (n) throw new CommandError(n === 1 ? Object.values(errors)[0]! : `${n} details need a quick fix.`, 422, errors);
  return out;
}
