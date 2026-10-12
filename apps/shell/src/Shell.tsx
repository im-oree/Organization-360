import { useBrand, useEvents } from "@o360/platform";
import { Toaster, toast } from "@o360/ui";
import { motion } from "motion/react";
import { Suspense } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router";
import { modules } from "./modules";

export function Shell() {
  const brand = useBrand();
  const location = useLocation();

  useEvents("", (e) => {
    for (const m of modules) {
      const text = m.notify?.[e.name]?.(e.payload);
      if (text) toast(text);
    }
  });

  return (
    <div className="flex h-full flex-col sm:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface p-3 backdrop-blur-xl sm:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2 pt-2">
          <img src={brand.logo} alt="" className="size-7 rounded-lg" />
          <span className="truncate text-[15px] font-semibold">{brand.name}</span>
        </div>
        <nav className="space-y-0.5">
          {modules.map((m) => <NavItem key={m.id} to={m.path} icon={m.icon} title={m.title} />)}
        </nav>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={null}>
          <Routes location={location} key={location.pathname}>
            {modules.map((m) => <Route key={m.id} path={m.path} element={<m.page />} />)}
          </Routes>
        </Suspense>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        {modules.map((m) => (
          <NavLink key={m.id} to={m.path} end className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${isActive ? "text-accent" : "text-muted"}`}>
            <m.icon className="size-6" strokeWidth={1.8} />
            {m.title}
          </NavLink>
        ))}
      </nav>
      <Toaster />
    </div>
  );
}

function NavItem({ to, icon: Icon, title }: { to: string; icon: (typeof modules)[number]["icon"]; title: string }) {
  return (
    <NavLink to={to} end className="relative block">
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-[10px] bg-fill" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
          <span className={`relative flex items-center gap-2.5 px-2.5 py-1.5 text-[14px] ${isActive ? "font-medium text-ink" : "text-muted hover:text-ink"}`}>
            <Icon className={`size-[18px] ${isActive ? "text-accent" : ""}`} strokeWidth={1.8} />
            {title}
          </span>
        </>
      )}
    </NavLink>
  );
}
