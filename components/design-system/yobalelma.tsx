import * as React from "react";
import { Check, CircleAlert, Inbox, LoaderCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type YobalelmaTone = "neutral" | "success" | "warning" | "danger" | "info";

export function YbPageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode; className?: string }) {
  return <header className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}><div className="min-w-0">{eyebrow ? <p className="yb-eyebrow">{eyebrow}</p> : null}<h1 className="yb-title mt-2">{title}</h1>{description ? <p className="yb-subtitle mt-3">{description}</p> : null}</div>{actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}</header>;
}

export function YbCard({ interactive = false, className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={cn("yb-card", interactive && "yb-card-interactive", className)} {...props}>{children}</div>;
}

export function YbStatus({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: YobalelmaTone; className?: string }) {
  return <span className={cn("yb-status", className)} data-tone={tone}>{children}</span>;
}

export function YbMetric({ label, value, detail, icon: Icon, className }: { label: string; value: React.ReactNode; detail?: React.ReactNode; icon?: LucideIcon; className?: string }) {
  return <article className={cn("yb-kpi", className)}>{Icon ? <span className="mb-6 grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--yb-product-soft))] text-[hsl(var(--yb-product-ink))]"><Icon className="h-5 w-5" aria-hidden="true" /></span> : null}<p className="text-xs font-extrabold uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="yb-kpi-value mt-2">{value}</p>{detail ? <div className="mt-3 text-sm text-muted-foreground">{detail}</div> : null}</article>;
}

export function YbEmptyState({ title, description, action, icon: Icon = Inbox, className }: { title: string; description: string; action?: React.ReactNode; icon?: LucideIcon; className?: string }) {
  return <section className={cn("yb-empty", className)}><div className="max-w-md"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--yb-product-soft))] text-[hsl(var(--yb-product-ink))]"><Icon className="h-6 w-6" aria-hidden="true" /></span><h2 className="mt-5 text-xl font-extrabold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{action ? <div className="mt-5 flex justify-center">{action}</div> : null}</div></section>;
}

export function YbNotice({ title, children, tone = "info", className }: { title: string; children: React.ReactNode; tone?: YobalelmaTone; className?: string }) {
  const Icon = tone === "success" ? Check : CircleAlert;
  return <aside className={cn("flex gap-3 rounded-xl border bg-card p-4 shadow-[var(--yb-shadow-sm)]", className)} role={tone === "danger" ? "alert" : "status"}><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[hsl(var(--yb-product-soft))] text-[hsl(var(--yb-product-ink))]"><Icon className="h-4 w-4" /></span><div><p className="font-extrabold">{title}</p><div className="mt-1 text-sm leading-6 text-muted-foreground">{children}</div></div></aside>;
}

export type YbTimelineItem = { id: string; title: string; description?: string; meta?: React.ReactNode; state: "upcoming" | "current" | "complete" };
export function YbTimeline({ items, className }: { items: YbTimelineItem[]; className?: string }) {
  return <ol className={cn("yb-timeline", className)}>{items.map((item) => <li className="yb-timeline-step" data-state={item.state} key={item.id}><span className="yb-timeline-dot" aria-hidden="true">{item.state === "complete" ? <Check className="h-3 w-3" /> : null}</span><div><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-extrabold">{item.title}</p>{item.meta ? <span className="text-xs font-semibold text-muted-foreground">{item.meta}</span> : null}</div>{item.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}</div></li>)}</ol>;
}

export function YbTableFrame({ children, label, className }: { children: React.ReactNode; label?: string; className?: string }) {
  return <div className={cn("yb-table-frame", className)} role="region" aria-label={label} tabIndex={0}>{children}</div>;
}

export function YbLoader({ label = "Chargement en cours", className }: { label?: string; className?: string }) {
  return <div className={cn("inline-flex items-center gap-3", className)} role="status"><LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" /><span className="text-sm font-bold text-muted-foreground">{label}</span></div>;
}

export function YbSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("yb-skeleton h-4", className)} aria-hidden="true" {...props} />;
}
