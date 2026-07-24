import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, FileCheck2, Layers3, ShieldAlert } from "lucide-react";
import {
  PremiumEmptyState,
  PremiumKpi,
  PremiumPanel,
} from "@/components/design-system/premium";
import type {
  AccountStatus,
  IdentityVerificationStatus,
} from "@/lib/auth/server";
import { toUserFacingMessage } from "@/lib/presentation/user-facing-copy";

export function ConfigurationNotice({
  label = "Connexion au service indisponible",
}: {
  label?: string;
}) {
  return (
    <PremiumPanel tone="support" className="p-6">
      <h2 className="text-2xl font-black">{label}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Ce service est momentanément indisponible. Réessaie dans quelques instants ou contacte l&apos;assistance Yobalelma.
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
    <PremiumEmptyState
      title={title}
      description={toUserFacingMessage(
        description,
        "Nous ne pouvons pas afficher ces informations pour le moment. Réessaie dans quelques instants.",
      )}
      action={action}
    />
  );
}

export function AccountAccessNotice({
  accountStatus,
  identityStatus,
}: {
  accountStatus: AccountStatus;
  identityStatus: IdentityVerificationStatus;
}) {
  if (accountStatus === "pending_email_confirmation") {
    return (
      <PremiumPanel tone="support" className="p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-black">Adresse e-mail à confirmer</h2>
            <p className="mt-3 max-w-2xl leading-7 text-black/60">
              Consulte le message envoyé par Yobalelma et confirme ton adresse avant d’accéder à tes dossiers.
            </p>
          </div>
        </div>
      </PremiumPanel>
    );
  }

  if (accountStatus === "suspended" || accountStatus === "closed") {
    return (
      <PremiumPanel tone="support" className="p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-black">
              {accountStatus === "closed" ? "Compte ferme" : "Compte suspendu"}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-black/60">
              L&apos;accès à ton espace est temporairement suspendu. Contacte l&apos;assistance
              Yobalelma pour vérifier ton dossier avant de reprendre tes activités.
            </p>
          </div>
        </div>
      </PremiumPanel>
    );
  }

  if (identityStatus === "approved") {
    return null;
  }

  const copyByStatus: Record<IdentityVerificationStatus, { title: string; description: string }> = {
    approved: {
      title: "Identité vérifiée",
      description: "Ton identité est validée.",
    },
    expired: {
      title: "Vérification expirée",
      description: "Ajoute un document a jour pour continuer les operations sensibles.",
    },
    needs_more_information: {
      title: "Vérification incomplète",
      description: "Le dossier necessite une correction avant validation finale.",
    },
    pending: {
      title: "Vérification en attente",
      description: "Complete ton dossier d'identite pour debloquer les actions sensibles.",
    },
    rejected: {
      title: "Vérification refusée",
      description: "Le dossier a ete refuse. Consulte le support pour connaitre les corrections attendues.",
    },
    submitted: {
      title: "Vérification transmise",
      description: "Le dossier est en cours de verification par l'equipe Yobalelma.",
    },
  };
  const copy = copyByStatus[identityStatus];

  return (
    <PremiumPanel tone="support" className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black">{copy.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">{copy.description}</p>
        </div>
      </div>
    </PremiumPanel>
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
          <FileCheck2 className="h-5 w-5" aria-hidden="true" />
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
      description="Indicateur mis a jour avec l'activite disponible."
    />
  );
}
