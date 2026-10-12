import { defaultPrefs, Login, type Me, type Role, type User } from "@o360/contracts";
import { CommandError, defineServerModule, fileCollection, guard, actorOf, type Actor } from "@o360/server-kit";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

type Credential = { id: string; hash: string; salt: string };
type Session = { id: string; userId: string; expiresAt: string };

const SESSION_COOKIE = "o360_session";
const SESSION_DAYS = 14;

const defaultRoles: Role[] = [
  { id: "owner", name: "Owner", permissions: ["*"], system: true },
  { id: "admin", name: "Administrator", permissions: ["people.*", "tasks.*", "identity.*", "automation.*", "platform.*"], system: false },
  { id: "hr", name: "HR Manager", permissions: ["people.*", "tasks.*", "identity.user.view"], system: false },
  { id: "lead", name: "Team Lead", permissions: ["people.member.view", "people.member.update", "tasks.*"], system: false },
  { id: "member", name: "Member", permissions: ["people.member.view", "tasks.task.view", "tasks.task.create", "tasks.task.toggle"], system: true },
  { id: "reader", name: "Badge Reader", permissions: ["people.badge.scan"], system: false },
];
const roles = fileCollection<Role>("roles", defaultRoles);
// Default roles added in later versions appear on existing installs too.
for (const r of defaultRoles) if (!roles.get(r.id)) roles.put(r);
const users = fileCollection<User>("users");
const credentials = fileCollection<Credential>("credentials");
const sessions = fileCollection<Session>("sessions");

const hashPassword = (password: string, salt = randomBytes(16).toString("hex")) => ({ salt, hash: scryptSync(password, salt, 64).toString("hex") });
const verify = (password: string, c: Credential) => timingSafeEqual(Buffer.from(c.hash, "hex"), scryptSync(password, c.salt, 64));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function permissionsOf(user: User) {
  return [...new Set(user.roleIds.flatMap((id) => roles.get(id)?.permissions ?? []))];
}
const me = (u: User): Me => ({ ...u, prefs: { ...defaultPrefs, ...u.prefs }, permissions: permissionsOf(u) });
const findByEmail = (email: string) => users.all().find((u) => u.email.toLowerCase() === email.toLowerCase());

function createUser(name: string, email: string, password: string, roleIds: string[], mustChangePassword: boolean) {
  if (findByEmail(email)) throw new CommandError("Someone already uses that email address. Try a different one.", 409);
  for (const r of roleIds) if (!roles.get(r)) throw new CommandError("One of the selected roles no longer exists. Refresh and pick again.", 422);
  const user = users.put({ id: crypto.randomUUID(), name, email, roleIds, status: "active", mustChangePassword, prefs: defaultPrefs, createdAt: new Date().toISOString() });
  credentials.put({ id: user.id, ...hashPassword(password) });
  return user;
}

/** First run: create the owner account from env, or a generated password printed once. */
if (users.all().length === 0) {
  const email = process.env.OWNER_EMAIL ?? "owner@example.com";
  const password = process.env.OWNER_PASSWORD ?? randomBytes(9).toString("base64url");
  createUser("Owner", email, password, ["owner"], !process.env.OWNER_PASSWORD);
  console.log(`\n  Owner account → ${email} / ${password}\n`);
}

/**
 * Demo accounts, one per role, for trying the platform as different people.
 * Only when DEMO_ACCOUNTS isn't "off" and not in production. New roles get an account automatically.
 */
const DEMO = process.env.DEMO_ACCOUNTS !== "off" && process.env.NODE_ENV !== "production";
const DEMO_PASSWORD = "Demo1234!";
const fakeNames = ["Bola Adeyemi", "Funke Hassan", "Emeka Obi", "Sade Lawal", "Ifeanyi Eze", "Zainab Musa", "Tobi Adewale", "Ngozi Umeh", "Kunle Bakare", "Amaka Okoro"];

function demoAccounts() {
  return roles.all().map((r, i) => {
    const email = `demo.${r.id}@example.com`;
    let u = findByEmail(email);
    if (!u) {
      u = createUser(r.id === "reader" ? "Front Door Reader" : fakeNames[i % fakeNames.length]!, email, DEMO_PASSWORD, [r.id], false);
    }
    return { name: u.name, email, password: DEMO_PASSWORD, role: r.name, permissions: r.permissions.length };
  });
}

/** Resolves the session cookie or bearer token to an actor. */
export function authenticate(token: string | undefined): Actor | undefined {
  if (!token) return;
  const s = sessions.get(sha(token));
  if (!s || s.expiresAt < new Date().toISOString()) return;
  const u = users.get(s.userId);
  if (!u || u.status !== "active") return;
  return { id: u.id, name: u.name, email: u.email, permissions: permissionsOf(u) };
}
export const tokenFrom = (cookie: string | undefined, auth: string | undefined) => cookie ?? auth?.replace(/^Bearer /, "");
export { SESSION_COOKIE };

export default defineServerModule({
  id: "identity",
  app: {
    title: "Access",
    permissions: [
      { key: "identity.user.view", label: "View users" },
      { key: "identity.user.create", label: "Invite users" },
      { key: "identity.user.update", label: "Edit users" },
      { key: "identity.user.suspend", label: "Pause accounts" },
      { key: "identity.role.view", label: "View roles" },
      { key: "identity.role.save", label: "Edit roles" },
    ],
  },
  routes(app) {
    app.post("/auth/login", async (c) => {
      const { email, password } = Login.parse(await c.req.json());
      const u = findByEmail(email);
      const cred = u && credentials.get(u.id);
      if (!u || !cred || !verify(password, cred)) throw new CommandError("That email and password don't match an account. Check them and try again.", 401);
      if (u.status !== "active") throw new CommandError("This account is paused. Ask an administrator to turn it back on.", 403);
      const token = randomBytes(32).toString("base64url");
      sessions.put({ id: sha(token), userId: u.id, expiresAt: new Date(Date.now() + SESSION_DAYS * 864e5).toISOString() });
      setCookie(c, SESSION_COOKIE, token, { httpOnly: true, sameSite: "Lax", path: "/", maxAge: SESSION_DAYS * 86400, secure: c.req.url.startsWith("https") });
      return c.json({ user: me(u), token });
    });
    app.post("/auth/logout", (c) => {
      const t = getCookie(c, SESSION_COOKIE);
      if (t) sessions.remove(sha(t));
      deleteCookie(c, SESSION_COOKIE, { path: "/" });
      return c.json({ ok: true });
    });
    app.get("/auth/me", (c) => {
      const a = actorOf(c);
      const u = a && users.get(a.id);
      if (!u) throw new CommandError("Your session has ended. Sign in again to continue.", 401);
      return c.json(me(u));
    });
    if (DEMO) app.get("/dev/accounts", (c) => c.json(demoAccounts()));
    app.get("/users", guard("identity.user.view"), (c) => c.json(users.all().sort((a, b) => a.name.localeCompare(b.name))));
    app.get("/roles", guard("identity.role.view"), (c) => c.json(roles.all()));
  },
  selfService: ["identity.password.change", "identity.prefs.save"],
  rules: [
    {
      id: "offboard-signin",
      title: "Offboarded → pause their sign-in",
      enabled: true,
      on: "people.member.offboarded",
      run: "identity.user.suspend",
      map: (m: { email: string }) => ({ email: m.email }),
    },
  ],
  commands: {
    "identity.user.create"({ name, email, password, roleIds }, { bus }) {
      const u = createUser(name, email, password, roleIds, true);
      bus.publish("identity.user.created", u);
      return u;
    },
    "identity.user.update"({ id, roleIds, status }, { bus, actor }) {
      const u = users.get(id);
      if (!u) throw new CommandError("We couldn't find that. It may have been removed by someone else. Refresh to see the latest.", 404);
      if (id === actor.id && (status === "suspended" || (roleIds && !roleIds.includes("owner") && u.roleIds.includes("owner"))))
        throw new CommandError("You can't pause or demote your own account. Ask another owner to do it.", 409);
      if (roleIds?.includes("owner") && !actor.permissions.includes("*")) throw new CommandError("Only an owner can make someone else an owner.", 403);
      const next = users.put({ ...u, roleIds: roleIds ?? u.roleIds, status: status ?? u.status });
      if (status === "suspended") for (const s of sessions.all()) if (s.userId === id) sessions.remove(s.id);
      bus.publish("identity.user.updated", next);
      return next;
    },
    "identity.user.suspend"({ email }, { bus }) {
      const u = findByEmail(email);
      if (!u || u.status === "suspended") return { skipped: true };
      if (u.roleIds.includes("owner")) throw new CommandError("Owner accounts aren't paused automatically. Pause it by hand if you're sure.", 409);
      const next = users.put({ ...u, status: "suspended" });
      for (const s of sessions.all()) if (s.userId === u.id) sessions.remove(s.id);
      bus.publish("identity.user.updated", next);
      return next;
    },
    "identity.role.save"(input, { bus }) {
      const existing = input.id ? roles.get(input.id) : undefined;
      if (existing?.id === "owner") throw new CommandError("The Owner role always has full access, so it can't be edited.", 409);
      const role = roles.put({ id: input.id ?? crypto.randomUUID(), name: input.name, permissions: input.permissions, system: existing?.system ?? false });
      bus.publish("identity.role.saved", role);
      return role;
    },
    "identity.prefs.save"(patch, { actor }) {
      const u = users.get(actor.id);
      if (!u) throw new CommandError("Your session has ended. Sign in again to continue.", 401);
      return users.put({ ...u, prefs: { ...defaultPrefs, ...u.prefs, ...patch } }).prefs;
    },
    "identity.password.change"({ current, next }, { actor }) {
      const cred = credentials.get(actor.id);
      const u = users.get(actor.id);
      if (!cred || !u || !verify(current, cred)) throw new CommandError("Your current password doesn't match. Try it again.", 401);
      credentials.put({ id: u.id, ...hashPassword(next) });
      users.put({ ...u, mustChangePassword: false });
      return { ok: true };
    },
  },
});
