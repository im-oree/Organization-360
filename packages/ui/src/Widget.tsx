import type { ReactNode } from "react";
import { Link } from "react-router";
import { Card } from "./Card";

/** Standard frame for Home widgets: title, optional link out, body. */
export function WidgetFrame({ title, to, action, children }: { title: string; to?: string; action?: string; children: ReactNode }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <h2 className="text-[14px] font-bold text-accent">{title}</h2>
        {to && <Link to={to} className="text-[12px] font-semibold text-muted hover:text-accent">{action ?? "Open"}</Link>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </Card>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "warn" }) {
  return (
    <div className="rounded-[10px] bg-bg px-3 py-2.5">
      <p className="text-[12px] text-muted">{label}</p>
      <p className={`text-[22px] font-bold tabular-nums tracking-tight ${tone === "warn" ? "text-warning" : "text-ink"}`}>{value}</p>
    </div>
  );
}
