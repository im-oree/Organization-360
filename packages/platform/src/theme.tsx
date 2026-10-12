import type { Prefs } from "@o360/contracts";
import { useEffect } from "react";
import { useAuth } from "./auth";

const KEY = "o360.theme";

/** Resolves "system" against the OS setting and applies data-theme. Caches the choice for the next first paint. */
export function applyTheme(theme: Prefs["theme"]) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0c111f" : "#ffffff");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable */
  }
}

export const cachedTheme = (): Prefs["theme"] => {
  try {
    return (localStorage.getItem(KEY) as Prefs["theme"]) ?? "system";
  } catch {
    return "system";
  }
};

/** Keeps the page theme in sync with the person's saved preference and the OS when set to System. */
export function useThemeSync() {
  const { me } = useAuth();
  const theme = me?.prefs.theme ?? cachedTheme();
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);
}
