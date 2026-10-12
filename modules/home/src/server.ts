import type { Task } from "@o360/contracts";
import { CommandError, defineServerModule, fileCollection, guard } from "@o360/server-kit";

const tasks = fileCollection<Task>("tasks");

export default defineServerModule({
  id: "home",
  routes(app) {
    app.get("/tasks", guard("tasks.task.view"), (c) => c.json(tasks.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
  },
  commands: {
    "tasks.task.create"({ title, source }, { bus }) {
      const task = tasks.put({ id: crypto.randomUUID(), title, source, done: false, createdAt: new Date().toISOString() });
      bus.publish("tasks.task.created", task);
      return task;
    },
    "tasks.task.toggle"({ id }, { bus }) {
      const t = tasks.get(id);
      if (!t) throw new CommandError("We couldn't find that. It may have been removed by someone else. Refresh to see the latest.", 404);
      const next = tasks.put({ ...t, done: !t.done });
      bus.publish("tasks.task.updated", next);
      return next;
    },
  },
  rules: [
    {
      id: "onboarding-task",
      title: "New member → onboarding task",
      enabled: true,
      on: "people.member.created",
      run: "tasks.task.create",
      map: (m: { name: string }) => ({ title: `Onboard ${m.name}`, source: "automation" }),
    },
  ],
});
