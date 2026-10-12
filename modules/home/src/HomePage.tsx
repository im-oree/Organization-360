import { useAuth, useCan, useModules } from "@o360/platform";
import { motion } from "motion/react";
import { Suspense } from "react";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
const spans = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3" } as const;

/** Home is a dashboard: every installed module can contribute widgets, filtered by permission. */
export default function HomePage() {
  const { me } = useAuth();
  const can = useCan();
  const widgets = useModules()
    .flatMap((m) => m.widgets ?? [])
    .filter((w) => can(w.permission))
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  return (
    <div className="mx-auto max-w-6xl">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-accent">{greeting()}, {me?.name.split(" ")[0]}.</h1>
        <p className="mt-1 text-[14px] text-muted">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
      </motion.header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {widgets.map((w, i) => (
          <motion.section key={w.id} aria-label={w.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`${spans[w.span ?? 1]} ${w.span && w.span > 1 ? "md:col-span-2" : ""}`}>
            <Suspense fallback={<div className="h-40 animate-pulse rounded-brand bg-fill" />}>
              <w.component />
            </Suspense>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
