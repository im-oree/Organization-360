import { BrandMark, useAuth, useBrand, useCan, useEvents, type ModuleManifest } from "@o360/platform";
import { Avatar, confirm, ConfirmHost, Notifications, notify } from "@o360/ui";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router";
import { modules } from "./modules";
import { ChangePassword, SignIn } from "./SignIn";

const Verify = lazy(() => import("@o360/module-people/verify"));

export function Root() {
  const { me, ready } = useAuth();
  const verify = location.pathname.match(/^\/verify\/([^/]+)/);
  if (verify) return <Suspense fallback={null}><Verify staffNo={decodeURIComponent(verify[1]!)} /></Suspense>;
  if (!ready) return null;
  return (
    <>
      {!me ? <SignIn /> : me.mustChangePassword ? <ChangePassword /> : <Shell />}
      <Notifications />
      <ConfirmHost />
    </>
  );
}

function Shell() {
  const can = useCan();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const visible = modules.filter((m) => can(m.permission));
  const current = visible.find((m) => (m.path === "/" ? location.pathname === "/" : location.pathname.startsWith(m.path)));

  useEffect(() => setDrawer(false), [location.pathname]);
  useEvents("", (e) => {
    for (const m of visible) {
      const text = m.notify?.[e.name]?.(e.payload);
      if (text) notify.info(text);
    }
  });

  return (
    <div className="flex min-h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">Skip to content</a>
      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 border-r border-line bg-surface lg:block">
        <Sidebar items={visible} />
      </aside>
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-line bg-surface lg:hidden"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <Sidebar items={visible} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[54px] items-center gap-2 border-b border-line bg-surface px-4 text-[13px] sm:px-8">
          <button aria-label="Open menu" onClick={() => setDrawer(true)} className="-ml-1 grid size-10 place-items-center rounded-lg text-muted hover:bg-fill lg:hidden">
            <Menu className="size-5" />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
            <Link to="/" className="truncate text-muted hover:text-ink">{current?.area === "admin" ? "Backoffice" : "Workspace"}</Link>
            <span className="text-line">/</span>
            <strong className="truncate font-semibold text-accent">{current?.title ?? "Not found"}</strong>
          </nav>
          <ThemeToggle />
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-8 sm:py-10">
          <Suspense fallback={null}>
            <Routes>
              {visible.map((m) => <Route key={m.id} path={m.path === "/" ? "/" : `${m.path}/*`} element={<m.page />} />)}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ items }: { items: ModuleManifest[] }) {
  const brand = useBrand();
  const { me, signOut } = useAuth();
  const groups = [
    { label: "Workspace", items: items.filter((m) => m.area === "workspace") },
    { label: "Backoffice", items: items.filter((m) => m.area === "admin") },
  ].filter((g) => g.items.length);

  async function leave() {
    if (await confirm({ title: "Sign out?", detail: "You'll need your email and password to come back in.", confirm: "Sign out" })) void signOut();
  }

  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex min-h-[88px] items-center gap-3 border-b border-line px-6">
        <BrandMark />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-accent">{brand.name}</span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-label">Backoffice</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="mb-2 px-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-label">{g.label}</p>
            {g.items.map((m) => (
              <NavLink key={m.id} to={m.path} end={m.path === "/"} className="relative block">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-active" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    <span className={`relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] ${isActive ? "font-semibold text-accent" : "text-muted hover:bg-fill hover:text-ink"}`}>
                      <m.icon className="size-[17px]" strokeWidth={1.8} />
                      {m.title}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {me && (
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-[10px] bg-bg p-2.5">
            <Avatar name={me.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{me.name}</p>
              <p className="truncate text-[11px] text-muted">{me.email}</p>
            </div>
            <button aria-label="Sign out" onClick={leave} className="grid size-8 place-items-center rounded-lg border border-line bg-surface text-muted hover:text-ink">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* storage unavailable */ }
  }, [dark]);
  return (
    <button aria-label={dark ? "Use light theme" : "Use dark theme"} onClick={() => setDark(!dark)} className="ml-auto grid size-9 place-items-center rounded-lg border border-line text-muted hover:text-ink">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-[22px] font-bold text-accent">This page isn't here</h1>
      <p className="mt-2 text-[14px] text-muted">It may have moved, or your role doesn't include it.</p>
      <Link to="/" className="mt-6 inline-block text-[14px] font-semibold text-accent hover:underline">Go to Home</Link>
    </div>
  );
}
