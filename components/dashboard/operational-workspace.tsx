import { ArrowUpRight, Gauge, ShieldCheck } from "lucide-react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import {
  PremiumActionCard,
  PremiumBadge,
  PremiumKpi,
  PremiumPanel,
  toneFromLabel,
} from "@/components/design-system/premium";
import { PageShell } from "@/components/layout/page-shell";
import {
  AccountAccessNotice,
  ConfigurationNotice,
  EmptyState,
} from "@/components/operations/status-panels";
import { SignalTimeline, type JourneyScene } from "@/components/visual/yobalelma-world";
import { requireRole } from "@/lib/auth/server";
import {
  type PlatformPermission,
  type PlatformRole,
} from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type TableName = Extract<keyof Database["public"]["Tables"], string>;

export type WorkspaceMetric = {
  label: string;
  table: TableName;
  userColumn?: string;
  filter?: {
    column: string;
    value: string | number | boolean;
  };
};

export type WorkspaceAction = {
  href: string;
  label: string;
  permission?: PlatformPermission;
  variant?: "default" | "secondary" | "outline" | "ghost" | "dark";
};

export type OperationalWorkspaceConfig = {
  allowedRoles: PlatformRole[];
  actions: WorkspaceAction[];
  checkpoints: string[];
  description: string;
  emptyTitle?: string;
  eyebrow: string;
  metrics: WorkspaceMetric[];
  permission: PlatformPermission;
  scene?: JourneyScene;
  title: string;
};

type OperationalWorkspaceProps = {
  children?: React.ReactNode;
  config: OperationalWorkspaceConfig;
  returnTo: string;
};

export async function OperationalWorkspace({
  children,
  config,
  returnTo,
}: OperationalWorkspaceProps) {
  const state = await requireRole(config.allowedRoles, returnTo);

  return (
    <PageShell
      eyebrow={config.eyebrow}
      title={config.title}
      description={config.description}
      scene={config.scene}
    >
      {state.status === "ready" ? (
        <div className="grid gap-5">
          <AccountAccessNotice
            accountStatus={state.accountStatus}
            identityStatus={state.identityStatus}
          />
          <PermissionGuard
            role={state.role}
            anyOf={[config.permission]}
            fallback={
              <EmptyState
                title="Accès limité"
                description="Cet espace n’est pas inclus dans ton profil actuel. Contacte l’assistance Yobalelma si tu penses qu’il devrait l’être."
              />
            }
          >
            <WorkspaceContent config={config} userId={state.userId} role={state.role} />
            {children}
          </PermissionGuard>
        </div>
      ) : state.status === "blocked" ? (
        <AccountAccessNotice
          accountStatus={state.accountStatus}
          identityStatus={state.identityStatus}
        />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function WorkspaceContent({
  config,
  role,
  userId,
}: {
  config: OperationalWorkspaceConfig;
  role: PlatformRole;
  userId: string;
}) {
  const metrics = await loadWorkspaceMetrics(config.metrics, userId);
  const tone = toneFromLabel(`${config.eyebrow} ${config.title}`);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <PremiumPanel tone={tone} className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <PremiumBadge tone={tone}>À faire</PremiumBadge>
              <h2 className="text-xl font-black">Tes actions disponibles</h2>
              <p className="mt-2 max-w-2xl leading-7 text-black/75">
                Chaque action est adaptée à ton profil et à l’avancement de tes dossiers.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {config.actions.map((action) => (
              <PermissionGuard
                key={action.href}
                role={role}
                anyOf={action.permission ? [action.permission] : [config.permission]}
              >
                <PremiumActionCard
                  href={action.href}
                  label={action.label}
                  description="Accède à cette rubrique depuis ton espace Yobalelma."
                  icon={ArrowUpRight}
                  tone={tone}
                />
              </PermissionGuard>
            ))}
          </div>
        </PremiumPanel>

        <PremiumPanel tone={tone} className="p-5">
          <p className="text-sm font-bold uppercase text-black/65">Aperçu du compte</p>
          <p className="mt-2 text-2xl font-black">{config.emptyTitle ?? "Espace prêt"}</p>
          <p className="mt-2 text-sm leading-6 text-black/75">
            Les indicateurs se mettent à jour dès qu&apos;une activité est disponible.
          </p>
        </PremiumPanel>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <PremiumKpi
            key={metric.label}
            label={metric.label}
            value={metric.count}
            icon={Gauge}
            tone={tone}
            description={metric.error ? "Donnée temporairement indisponible." : "Activité disponible pour ce compte."}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <PremiumBadge tone={tone}>Repères</PremiumBadge>
          <h2 className="mt-2 text-2xl font-black">Prochaines étapes</h2>
          <SignalTimeline scene={config.scene ?? "operations"} items={config.checkpoints} className="mt-5" />
        </div>
      </section>
    </div>
  );
}

async function loadWorkspaceMetrics(metrics: WorkspaceMetric[], userId: string) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return metrics.map((metric) => ({
      count: 0,
      error: "Connexion au service indisponible",
      label: metric.label,
      table: metric.table,
    }));
  }

  return Promise.all(
    metrics.map(async (metric) => {
      try {
        let query = supabase
          .from(metric.table)
          .select("*", { count: "exact", head: true });

        if (metric.userColumn) {
          query = query.eq(metric.userColumn, userId);
        }

        if (metric.filter) {
          query = query.eq(metric.filter.column, metric.filter.value);
        }

        const { count, error } = await query;

        return {
          count: count ?? 0,
          error: error?.message,
          label: metric.label,
          table: metric.table,
        };
      } catch (error) {
        return {
          count: 0,
          error: error instanceof Error ? error.message : "Erreur de lecture",
          label: metric.label,
          table: metric.table,
        };
      }
    }),
  );
}
