import type { Task } from "@o360/contracts";
import { api, useAction, useAuth, useCan, useModules, useResource } from "@o360/platform";
import { Card, Empty, LoadError, notify } from "@o360/ui";
import { ArrowRight, Check, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function HomePage() {
  const { me } = useAuth();
  const can = useCan();
  const apps = useModules().filter((m) => m.launcher !== false && can(m.permission));

  return (
    <div className="mx-auto max-w-5xl">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-accent">{greeting()}, {me?.name.split(" ")[0]}.</h1>
        <p className="mt-1 text-[15px] text-muted">Pick up where you left off.</p>
      </motion.header>

      <section aria-label="Apps" className="mb-12 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((m, i) => (
          <Link key={m.id} to={m.path} className="group block rounded-brand focus-visible:outline-offset-2">
            <Card interactive transition={{ delay: i * 0.03 }} className="flex h-full items-center gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <m.icon className="size-5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-accent">{m.title}</span>
                <span className="block truncate text-[13px] text-muted">{m.summary}</span>
              </span>
              <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
            </Card>
          </Link>
        ))}
      </section>

      {can("tasks.task.view") && <Tasks />}
    </div>
  );
}

function Tasks() {
  const can = useCan();
  const { data: tasks = [], error, reload, loading } = useResource<Task[]>("/tasks", "tasks.");
  const toggle = useAction((id: string) => api.run("tasks.task.toggle", { id }));
  const open = tasks.filter((t) => !t.done).length;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold text-accent">Tasks</h2>
        {tasks.length > 0 && <span className="text-[13px] text-muted">{open} open of {tasks.length}</span>}
      </div>
      <Card className="overflow-hidden">
        {can("tasks.task.create") && <NewTask />}
        {error ? <LoadError message={error.message} retry={reload} /> : !loading && tasks.length === 0 ? <Empty>No tasks yet. Add one above.</Empty> : (
          <ul>
            <AnimatePresence initial={false}>
              {tasks.map((t) => (
                <motion.li key={t.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-line">
                  <button
                    disabled={!can("tasks.task.toggle")}
                    onClick={() => toggle.run(t.id)}
                    aria-pressed={t.done}
                    className="flex min-h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-fill"
                  >
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${t.done ? "border-accent bg-accent text-on-accent" : "border-muted/50"}`}>
                      {t.done && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 text-[14px] ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
                    {t.source === "automation" && <span className="flex items-center gap-1 text-[12px] text-muted"><Zap className="size-3" />Automated</span>}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </section>
  );
}

function NewTask() {
  const [title, setTitle] = useState("");
  const add = useAction((t: string) => api.run("tasks.task.create", { title: t }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return notify.info("Type a task first, then press Enter.");
    setTitle("");
    if (!(await add.run(t))) setTitle(t);
  }
  return (
    <form onSubmit={submit}>
      <input aria-label="New task" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task and press Enter" className="h-12 w-full bg-transparent px-4 text-[14px] outline-none placeholder:text-muted" />
    </form>
  );
}
