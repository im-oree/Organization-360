import type { Member } from "@o360/contracts";
import { CommandError, defineServerModule, fileCollection } from "@o360/server-kit";

const members = fileCollection<Member>("people", [
  { id: "m1", name: "Ada Obi", email: "ada@example.com", title: "Head of Operations", department: "Operations", joinedAt: "2024-02-01T09:00:00.000Z" },
  { id: "m2", name: "Tunde Bello", email: "tunde@example.com", title: "Engineering Lead", department: "Engineering", joinedAt: "2023-08-14T09:00:00.000Z" },
  { id: "m3", name: "Kemi Adeyemi", email: "kemi@example.com", title: "Product Designer", department: "Design", joinedAt: "2025-01-06T09:00:00.000Z" },
]);

export default defineServerModule({
  id: "people",
  routes(app) {
    app.get("/people", (c) => c.json(members.all().sort((a, b) => a.name.localeCompare(b.name))));
  },
  commands: {
    "people.member.create"(input, { bus }) {
      if (members.all().some((m) => m.email === input.email)) throw new CommandError("Email already in use", 409);
      const member = members.put({ ...input, id: crypto.randomUUID(), joinedAt: new Date().toISOString() });
      bus.publish("people.member.created", member);
      return member;
    },
    "people.member.remove"({ id }, { bus }) {
      if (!members.remove(id)) throw new CommandError("Not found", 404);
      bus.publish("people.member.removed", { id });
      return { id };
    },
  },
});
