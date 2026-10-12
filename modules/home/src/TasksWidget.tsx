import type { Task } from "@o360/contracts";
import { api, useAction, useCan, useResource } from "@o360/platform";
import { LoadError, notify, WidgetFrame } from "@o360/ui";
import { Check, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";

export default function TasksWidget() {
  const can = useCan();
  const { data: tasks = [], error, reload, loading } = useResource<Task[]>("/tasks", "tasks.");
  const toggle = useAction((id: string) => api.run("tasks.task.toggle", { id }));
  const open = tasks.filter((t) => !t.done);
  const recentDone = tasks.filter((t) => t.done).slice(0, 2);

  return (
    <WidgetFrame title={open.length ? `Tasks · ${open.length} open` : "Tasks"}>
      {can("tasks.task.create") && <NewTask />}
      {error ? <LoadError message={error.message} retry={reload} /> : !loading && tasks.length === 0 ? (
        <p className="px-4 py-8 text-center text-[14px] text-muted">Nothing to do. Add a task above.</p>
      ) : (
        <ul className="max-h-[360px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {[...open, ...recentDone].map((t) => (
              <motion.li key={t.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-line">
                <button disabled={!can("tasks.task.toggle")} onClick={() => toggle.run(t.id)} aria-pressed={t.done} className="flex min-h-11 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-fill">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${t.done ? "border-accent bg-accent text-on-accent" : "border-muted/50"}`}>
                    {t.done && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={`flex-1 truncate text-[14px] ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
                  {t.source === "automation" && <Zap className="size-3.5 shrink-0 text-muted" aria-label="Created by an automation" />}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </WidgetFrame>
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
    <form onSubmit={submit} className="border-t border-line">
      <input aria-label="New task" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task and press Enter" className="h-11 w-full bg-transparent px-4 text-[14px] outline-none placeholder:text-muted" />
    </form>
  );
}
