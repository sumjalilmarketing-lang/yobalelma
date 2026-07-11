import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ConfigurationNotice({
  label = "Configuration Supabase requise",
}: {
  label?: string;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-2xl font-black">{label}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Ajoute les variables d&apos;environnement Yobalelma pour activer ce parcours
        avec le projet Supabase attendu.
      </p>
    </div>
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
    <div className="rounded-lg border border-black/10 bg-white p-6 shadow-line">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 max-w-2xl leading-7 text-black/60">{description}</p>
      {action ? (
        <Button asChild className="mt-4">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
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
    <article className="h-full rounded-lg border border-black/10 bg-white p-5 shadow-line transition hover:border-primary/50 hover:shadow-panel">
      <h2 className="text-lg font-black">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm font-semibold text-black/60">{subtitle}</p> : null}
      <dl className="mt-4 grid gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1">
            <dt className="text-xs font-bold uppercase text-black/45">{row.label}</dt>
            <dd className="font-semibold text-black/78">{row.value}</dd>
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
