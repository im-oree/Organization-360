import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Collection storage interface. File adapter for local runs; a Postgres adapter replaces it in Phase 0. */
export interface Collection<T extends { id: string }> {
  all(): T[];
  get(id: string): T | undefined;
  put(item: T): T;
  remove(id: string): boolean;
}

const dir = process.env.DATA_DIR ?? join(process.cwd(), ".data");

export function fileCollection<T extends { id: string }>(name: string, seed: T[] = []): Collection<T> {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.json`);
  const items = new Map<string, T>(
    (existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T[]) : seed).map((i) => [i.id, i]),
  );
  const save = () => writeFileSync(file, JSON.stringify([...items.values()], null, 2));
  if (!existsSync(file)) save();
  return {
    all: () => [...items.values()],
    get: (id) => items.get(id),
    put(item) {
      items.set(item.id, item);
      save();
      return item;
    },
    remove(id) {
      const ok = items.delete(id);
      if (ok) save();
      return ok;
    },
  };
}
