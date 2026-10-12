import type { Member, Task } from "@o360/contracts";
import { api, useBrand, useResource } from "@o360/platform";
import { Card, Empty, Page } from "@o360/ui";
import { Check, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function HomePage() {
  const brand = useBrand();
  const { data: tasks = [] } = useResource<Task[]>("/tasks", "tasks.");
  const { data: people = [] } = useResource<Member[]>("/people", "people.");
  const open = tasks.filter((t) => !t.done).length;

  return (
    <Page title={greeting()}>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Open tasks" value={open} />
        <Stat label="People" value={people.length} />
        <Stat label="Workspace" value={brand.shortName} className="col-span-2 sm:col-span-1" />
      </div>

      <h2 className="mb-3 text-[20px] font-semibold tracking-tight">Tasks</h2>
      <Card className="overflow-hidden">
        <NewTask />
        {tasks.length === 0 ? (
          <Empty>All clear</Empty>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {tasks.map((t) => (
                <motion.li key={t.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-line">
                  <button
                    onClick={() => api.run("tasks.task.toggle", { id: t.id })}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-fill/50"
                  >
                    <motion.span
                      animate={{ scale: t.done ? [1, 1.2, 1] : 1 }}
                      className={`grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${t.done ? "border-accent bg-accent text-on-accent" : "border-muted/50"}`}
                    >
                      {t.done && <Check className="size-3.5" strokeWidth={3} />}
                    </motion.span>
                    <span className={`flex-1 text-[15px] transition-colors ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
                    {t.source === "automation" && <Zap className="size-3.5 text-accent" aria-label="Created by automation" />}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </Page>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <Card className={`p-4 ${className}`}>
      <p className="text-[13px] text-muted">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-[28px] font-semibold tracking-tight tabular-nums">
        {value}
      </motion.p>
    </Card>
  );
}

function NewTask() {
  const [title, setTitle] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    api.run("tasks.task.create", { title: title.trim() });
    setTitle("");
  }
  return (
    <form onSubmit={submit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" className="h-12 w-full bg-transparent px-4 text-[15px] outline-none placeholder:text-muted" />
    </form>
  );
}
