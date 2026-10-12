import { fileCollection } from "./store";

type Claim = { id: string; email: string; createdAt: string };

/**
 * Readable, permanent handles (e.g. "ada.obi"). One per person, keyed by email, unique across
 * the organization and never reused once taken, even after the person leaves.
 * Valid as an email local part, so `handle@domain` is ready for the mail app.
 */
const claims = fileCollection<Claim>("handles");

const slug = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40) || "user";

export const handles = {
  /** Returns the person's handle, creating one from their name the first time. */
  claim(email: string, name: string) {
    const e = email.toLowerCase();
    const existing = claims.all().find((c) => c.email === e);
    if (existing) return existing.id;
    const base = slug(name);
    let h = base;
    for (let n = 2; claims.get(h); n++) h = `${base}${n}`;
    claims.put({ id: h, email: e, createdAt: new Date().toISOString() });
    return h;
  },
  /** Keeps the handle with the person when their email changes. */
  rebind(oldEmail: string, newEmail: string) {
    const c = claims.all().find((x) => x.email === oldEmail.toLowerCase());
    if (c) claims.put({ ...c, email: newEmail.toLowerCase() });
  },
};
