import type { Catalogue, ExtValues, FieldDef } from "@o360/contracts";
import { Field, Select } from "@o360/ui";
import { useResource } from "./resource";

/** Installed apps, their permissions and extensions. Refreshes when an extension is switched. */
export const useCatalogue = () => useResource<Catalogue>("/catalogue", "platform.");

export function useExtensions(app: string) {
  const { data } = useCatalogue();
  return (data?.extensions ?? []).filter((e) => e.app === app && e.enabled);
}

/** Renders one FieldDef. Input names are `<prefix>.<key>` so forms can be read generically. */
export function DefField({ def, prefix, value, error }: { def: FieldDef; prefix: string; value?: string; error?: string }) {
  const name = `${prefix}.${def.key}`;
  if (def.type === "select")
    return (
      <div>
        <Select label={def.label} name={name} defaultValue={value ?? ""}>
          <option value="">Not set</option>
          {def.options?.map((o) => <option key={o}>{o}</option>)}
        </Select>
        {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
      </div>
    );
  return <Field label={def.label} name={name} type={def.type} defaultValue={value} placeholder={def.placeholder} hint={def.hint} maxLength={def.max} error={error} />;
}

/** Form fields for every enabled extension of an app. */
export function ExtensionFields({ app, values = {}, errors = {} }: { app: string; values?: ExtValues; errors?: Record<string, string> }) {
  const exts = useExtensions(app);
  return (
    <>
      {exts.flatMap((e) => e.fields.map((f) => <DefField key={`${e.id}.${f.key}`} def={f} prefix={`ext.${e.id}`} value={values[e.id]?.[f.key]} error={errors[`ext.${e.id}.${f.key}`]} />))}
    </>
  );
}

/** Read-only display of extension values, linked where the field defines a link. */
export function ExtensionValues({ app, values = {} }: { app: string; values?: ExtValues }) {
  const rows = useExtensions(app).flatMap((e) => e.fields.map((f) => ({ f, v: values[e.id]?.[f.key], id: `${e.id}.${f.key}` }))).filter((r) => r.v);
  if (!rows.length) return null;
  return (
    <>
      {rows.map(({ f, v, id }) => (
        <div key={id}>
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-label">{f.label}</dt>
          <dd className="mt-0.5 truncate text-[14px]">
            {f.linkTemplate ? <a href={f.linkTemplate.replace("{value}", encodeURIComponent(v!).replace(/%2F/g, "/").replace(/%3A/g, ":"))} target="_blank" rel="noreferrer" className="text-accent hover:underline">{v}</a> : v}
          </dd>
        </div>
      ))}
    </>
  );
}

/** Reads `ext.<id>.<key>` inputs from a submitted form into ExtValues. */
export function readExt(form: Record<string, string>): ExtValues {
  const out: ExtValues = {};
  for (const [k, v] of Object.entries(form)) {
    const m = k.match(/^ext\.([^.]+)\.([^.]+)$/);
    if (m) (out[m[1]!] ??= {})[m[2]!] = v;
  }
  return out;
}
