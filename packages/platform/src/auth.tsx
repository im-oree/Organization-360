import { can, type Me } from "@o360/contracts";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, onUnauthorized } from "./api";

type Auth = { me: Me | null; ready: boolean; refresh: () => Promise<void>; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  // Replace, never merge: revoked permissions must disappear.
  const refresh = useCallback(() => api.get<Me>("/auth/me").then(setMe, () => setMe(null)).finally(() => setReady(true)), []);
  useEffect(() => void refresh(), [refresh]);
  useEffect(() => onUnauthorized(() => setMe(null)), []);
  useEffect(() => {
    const t = setInterval(() => me && void refresh(), 60_000);
    return () => clearInterval(t);
  }, [me, refresh]);

  const signIn = async (email: string, password: string) => setMe((await api.post<{ user: Me }>("/auth/login", { email, password })).user);
  const signOut = async () => {
    await api.post("/auth/logout", {}).catch(() => {});
    setMe(null);
  };
  return <AuthContext.Provider value={{ me, ready, refresh, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const a = useContext(AuthContext);
  if (!a) throw new Error("useAuth outside AuthProvider");
  return a;
}

/** Client-side permission check. Only hides UI; the server enforces. */
export function useCan() {
  const { me } = useAuth();
  return (key?: string) => !key || (!!me && can(me.permissions, key));
}
