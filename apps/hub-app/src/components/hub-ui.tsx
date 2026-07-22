import Link from "next/link";
import { ArrowRight, Boxes, CircleAlert, PackageCheck, Plane, QrCode, Scale, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HubStatusTone } from "../lib/types";

const toneClasses: Record<HubStatusTone, string> = {
  danger: "border-error/25 bg-error/10 text-error",
  info: "border-info/25 bg-info/10 text-info",
  neutral: "border-black/10 bg-white text-foreground",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/15 text-earth",
};

export function PageHeader({
  actions,
  eyebrow,
  title,
  subtitle,
}: {
  actions?: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="yb-page-hero">
      <div className="hub-grid absolute inset-0 opacity-30" />
      <div className="hub-skyline absolute inset-x-0 bottom-0 h-24 opacity-25" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal md:text-5xl">{title}</h1>
          <p className="yb-page-hero-description mt-3 text-sm md:text-base">{subtitle}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={cn("yb-panel hub-card-reveal", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="yb-panel-title">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: HubStatusTone }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs font-black", toneClasses[tone])}>
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  href,
  tone = "primary",
}: {
  children: React.ReactNode;
  href: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <Link
      className={cn(
        "yb-button",
        tone === "primary" ? "yb-button-primary" : "border-white/25 bg-white/10 text-white hover:bg-white/15",
      )}
      href={href}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function EmptyState({
  actionHref,
  actionLabel,
  message,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  message: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-muted/40 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary shadow-line">
        <PackageCheck className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{message}</p>
      {actionHref && actionLabel ? (
        <Link className="mt-4 inline-flex rounded-md bg-black px-4 py-2 text-sm font-black text-white" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function KpiIcon({ name }: { name: string }) {
  const Icon =
    name === "capacity"
      ? Plane
      : name === "weight"
        ? Scale
        : name === "anomalies"
          ? CircleAlert
          : name === "storage"
            ? Boxes
            : name === "received"
              ? PackageCheck
              : name === "qr"
                ? QrCode
                : ShieldCheck;

  return <Icon className="h-5 w-5" />;
}

export function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "yb-field text-sm font-semibold";

export const selectClass = inputClass;

export const submitClass = "yb-button yb-button-primary w-full";
