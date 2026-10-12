import type { EventName } from "@o360/contracts";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { useEvents } from "./events";

/** Fetches a resource and refetches whenever a matching event arrives, so every view stays live. */
export function useResource<T>(path: string, refreshOn: EventName[] | string | null = null) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(() => api.get<T>(path).then(setData, setError), [path]);
  useEffect(() => void reload(), [reload]);
  useEvents(refreshOn, () => void reload());
  return { data, error, loading: data === undefined && !error, reload };
}
