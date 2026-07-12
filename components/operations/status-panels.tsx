import Link from "next/link";
import type { ReactNode } from "react";
import { Database, Layers3 } from "lucide-react";
import {
  PremiumEmptyState,
  PremiumKpi,
  PremiumPanel,
} from "@/components/design-system/premium";

export function ConfigurationNotice({
  label = "Configuration Supabase requise",
}: {
  label?: string;
}) {
  return (
    <PremiumPanel tone="support" className="p-6">
      <h2 className="text-2xl font-black">{label}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Ajoute les variables d&apos;environnement Yobalelma pour activer ce parcours
        avec le projet Supabase attendu.
      </p>
      <div className="mt-5 h-2 rounded-full bg-amber-100 yb-loader-line" />
    </PremiumPanel>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <PremiumEmptyState title={title} description={description} action={action} />
  );
}

export function DataGrid({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function DataCard({
  title,
  subtitle,
  rows,
  href,
}: {
  title: string;
  subtitle?: string;
  rows: { label: string; value: ReactNode }[];
  href?: string;
}) {
  const content = (
    <article className="h-full rounded-lg border border-black/10 bg-white p-5 shadow-line transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-semibold text-black/60">{subtitle}</p> : null}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Database className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1">
            <dt className="text-xs font-bold uppercase text-black/45">{row.label}</dt>
            <dd className="font-semibold text-black/80">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export function DataMetric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <PremiumKpi
      label={label}
      value={value}
      icon={Layers3}
      description="Donnee lue depuis les tables operationnelles ou etat vide explicite."
    />
  );
}
