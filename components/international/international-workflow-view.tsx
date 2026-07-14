import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Boxes,
  CheckCircle2,
  Clock3,
  Plane,
  QrCode,
  Route,
  ShieldAlert,
  Truck,
} from "lucide-react";
import {
  PremiumActionCard,
  PremiumBadge,
  PremiumEmptyState,
  PremiumKpi,
  PremiumPanel,
  type PremiumTone,
} from "@/components/design-system/premium";
import {
  actionsForInternationalWorkspace,
  internationalWorkflowSteps,
  type InternationalRoleWorkspace,
} from "@/lib/international/status-machine";
import {
  buildShipmentProgressRows,
  internationalStepSummary,
  type InternationalWorkflowData,
} from "@/lib/international/workflow-data";
import { cn } from "@/lib/utils";

const toneByWorkspace: Record<InternationalRoleWorkspace, PremiumTone> = {
  admin: "admin",
  client: "client",
  collection: "operations",
  hub: "hub",
  relay: "relay",
  transporter: "transporter",
  traveler: "traveler",
};

export function InternationalWorkflowView({
  data,
}: {
  data: InternationalWorkflowData;
}) {
  const tone = toneByWorkspace[data.workspace];

  if (data.status === "needs-env") {
    return (
      <PremiumEmptyState
        tone={tone}
        title="Configuration Supabase requise"
        description="Le cockpit international a besoin des variables Supabase locales pour lire les expeditions, lots, QR et notifications."
      />
    );
  }

  const shipmentRows = buildShipmentProgressRows(data.shipments, data.events);
  const stepRows = internationalStepSummary(data.events);
  const actions = actionsForInternationalWorkspace(data.workspace);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <PremiumPanel tone={tone} className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <PremiumBadge tone={tone}>Parcours international</PremiumBadge>
              <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight">
                Une chaine unique du client au relais destination.
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-black/60">
                Cette vue lit les tables Supabase du parcours international et expose les
                actions autorisees au role connecte. Les compteurs et listes respectent les
                policies RLS appliquees au projet.
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-white/80 p-4 shadow-line">
              <p className="text-xs font-black uppercase text-black/45">Derniere lecture</p>
              <p className="mt-2 text-sm font-black text-black">{formatDateTime(data.loadedAt)}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => (
              <PremiumActionCard
                key={action.href}
                href={action.href}
                label={action.label}
                description={action.description}
                tone={tone}
                icon={ArrowRight}
              />
            ))}
          </div>
        </PremiumPanel>

        <PremiumPanel tone={tone} className="p-6">
          <PremiumBadge tone={tone}>Controle qualite</PremiumBadge>
          <div className="mt-4 grid gap-3">
            {[
              "Donnees reelles lues via Supabase.",
              "Timeline reconstruite depuis shipment_status_events.",
              "Actions sensibles protegees par role et RLS.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-md border border-black/10 bg-white/80 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm font-bold leading-6 text-black/70">{item}</p>
              </div>
            ))}
          </div>
        </PremiumPanel>
      </section>

      {data.warnings.length ? (
        <PremiumPanel tone="support" className="p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-black">Lectures limitees ou a verifier</h2>
              <ul className="mt-2 grid gap-2 text-sm font-semibold leading-6 text-black/65">
                {data.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </PremiumPanel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <PremiumKpi
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            tone={tone}
            icon={metricIcon(metric.label)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <PremiumPanel tone={tone} className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <PremiumBadge tone={tone}>Timeline operationnelle</PremiumBadge>
              <h2 className="mt-3 text-2xl font-black">Statuts du flux international</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
                Les etapes ci-dessous sont la lecture produit du flux. Les badges indiquent
                combien d&apos;evenements reels correspondent aux statuts techniques.
              </p>
            </div>
            <span className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-black text-black/70">
              {internationalWorkflowSteps.length} etapes
            </span>
          </div>
          <div className="mt-6 grid gap-3">
            {stepRows.map((step, index) => (
              <article
                key={step.id}
                className={cn(
                  "grid gap-4 rounded-lg border bg-white/85 p-4 shadow-line md:grid-cols-[52px_1fr_auto]",
                  step.count ? "border-primary/40" : "border-black/10",
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
                  <span className="text-sm font-black">{index + 1}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-black">{step.label}</h3>
                    <span className="rounded-md bg-black px-2 py-1 text-xs font-black uppercase text-white">
                      {step.owner}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-black/60">{step.description}</p>
                  <p className="mt-2 text-xs font-bold uppercase text-black/45">
                    Preuve attendue: {step.requiredEvidence}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-black text-black/70">
                  <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                  {step.count}
                </div>
              </article>
            ))}
          </div>
        </PremiumPanel>

        <div className="grid gap-6">
          <RecentShipments rows={shipmentRows} tone={tone} />
          <InternationalSignals data={data} tone={tone} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <OperationalLists data={data} tone={tone} />
        <NotificationList data={data} tone={tone} />
      </section>
    </div>
  );
}

function RecentShipments({
  rows,
  tone,
}: {
  rows: ReturnType<typeof buildShipmentProgressRows>;
  tone: PremiumTone;
}) {
  if (!rows.length) {
    return (
      <PremiumEmptyState
        tone={tone}
        title="Aucune expedition internationale visible"
        description="Cree un envoi avec deux pays differents ou connecte-toi avec un role operationnel autorise."
        action={{ href: "/dashboard/client/shipments/new", label: "Creer un envoi" }}
      />
    );
  }

  return (
    <PremiumPanel tone={tone} className="p-6">
      <PremiumBadge tone={tone}>Expeditions recentes</PremiumBadge>
      <div className="mt-5 grid gap-4">
        {rows.map(({ currentLabel, lastEvent, nextLabel, percent, shipment }) => (
          <Link
            key={shipment.id}
            href={`/dashboard/client/shipments/${shipment.id}`}
            className="block rounded-lg border border-black/10 bg-white p-4 shadow-line transition hover:-translate-y-1 hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-primary">{shipment.tracking_code}</p>
                <h3 className="mt-1 text-base font-black">
                  {shipment.origin_city} {"->"} {shipment.destination_city}
                </h3>
                <p className="mt-1 text-sm leading-6 text-black/60">
                  {shipment.origin_country} vers {shipment.destination_country}
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-black uppercase text-primary">
                {shipment.status}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-black/65">
              <p>Etape: {currentLabel}</p>
              <p>Suite: {nextLabel}</p>
              <p>
                Dernier evenement:{" "}
                {lastEvent ? `${lastEvent.status} - ${formatDateTime(lastEvent.created_at)}` : "aucun evenement visible"}
              </p>
              <p>Prix estime: {formatMoney(shipment.estimated_price_cents, shipment.currency)}</p>
            </div>
          </Link>
        ))}
      </div>
    </PremiumPanel>
  );
}

function InternationalSignals({
  data,
  tone,
}: {
  data: Extract<InternationalWorkflowData, { status: "ready" }>;
  tone: PremiumTone;
}) {
  const activeQr = data.qrTokens.filter((token) => token.status === "active");
  const nextBatch = data.hubBatches[0] ?? null;

  return (
    <PremiumPanel tone={tone} className="p-6">
      <PremiumBadge tone={tone}>Signaux live</PremiumBadge>
      <div className="mt-5 grid gap-3">
        <SignalLine
          icon={QrCode}
          label="QR actifs"
          value={String(activeQr.length)}
          detail={activeQr[0] ? `${activeQr[0].token_type} expire ${formatDateTime(activeQr[0].expires_at)}` : "Aucun QR actif visible"}
        />
        <SignalLine
          icon={Plane}
          label="Prochain lot"
          value={nextBatch?.code ?? "Aucun"}
          detail={nextBatch ? `${nextBatch.origin_hub} -> ${nextBatch.destination_hub}` : "Cree un lot hub pour alimenter ce signal"}
        />
        <SignalLine
          icon={Bell}
          label="Notifications"
          value={String(data.notifications.length)}
          detail="Alertes in-app visibles pour l'utilisateur connecte."
        />
      </div>
    </PremiumPanel>
  );
}

function OperationalLists({
  data,
  tone,
}: {
  data: Extract<InternationalWorkflowData, { status: "ready" }>;
  tone: PremiumTone;
}) {
  return (
    <PremiumPanel tone={tone} className="p-6">
      <PremiumBadge tone={tone}>Operations connectees</PremiumBadge>
      <div className="mt-5 grid gap-4">
        <CompactList
          title="Relais"
          empty="Aucun inventaire relais visible."
          rows={data.relayInventory.slice(0, 4).map((item) => ({
            href: "/dashboard/relay/inventory",
            label: item.shipment_id,
            meta: `${item.status} depuis ${formatDateTime(item.checked_in_at)}`,
          }))}
        />
        <CompactList
          title="Collecte"
          empty="Aucune tournee visible."
          rows={data.collectionRoutes.slice(0, 4).map((route) => ({
            href: "/dashboard/collection/routes",
            label: route.name,
            meta: `${route.status} - ${route.route_date}`,
          }))}
        />
        <CompactList
          title="Hub"
          empty="Aucun lot hub visible."
          rows={data.hubBatches.slice(0, 4).map((batch) => ({
            href: "/dashboard/hub/batches",
            label: batch.code,
            meta: `${batch.status} - ${batch.reserved_weight_kg}/${batch.capacity_kg} kg`,
          }))}
        />
      </div>
    </PremiumPanel>
  );
}

function NotificationList({
  data,
  tone,
}: {
  data: Extract<InternationalWorkflowData, { status: "ready" }>;
  tone: PremiumTone;
}) {
  return (
    <PremiumPanel tone={tone} className="p-6">
      <PremiumBadge tone={tone}>Notifications et audit utilisateur</PremiumBadge>
      {data.notifications.length ? (
        <div className="mt-5 grid gap-3">
          {data.notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.action_url ?? "/dashboard"}
              className="rounded-lg border border-black/10 bg-white p-4 shadow-line transition hover:-translate-y-1 hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black">{notification.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-black/60">{notification.body}</p>
                </div>
                <span className="rounded-md bg-secondary px-2 py-1 text-xs font-black uppercase text-primary">
                  {notification.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-black/10 bg-white p-4 text-sm font-semibold leading-6 text-black/60">
          Aucune notification internationale visible pour ce compte.
        </p>
      )}
    </PremiumPanel>
  );
}

function CompactList({
  empty,
  rows,
  title,
}: {
  empty: string;
  rows: Array<{ href: string; label: string; meta: string }>;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-line">
      <h3 className="text-base font-black">{title}</h3>
      {rows.length ? (
        <div className="mt-3 grid gap-2">
          {rows.map((row) => (
            <Link
              key={`${row.href}-${row.label}-${row.meta}`}
              href={row.href}
              className="flex items-center justify-between gap-3 rounded-md bg-black/[0.03] px-3 py-2 text-sm font-bold text-black/70 transition hover:bg-secondary"
            >
              <span className="min-w-0 truncate">{row.label}</span>
              <span className="shrink-0 text-xs text-black/45">{row.meta}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-black/55">{empty}</p>
      )}
    </div>
  );
}

function SignalLine({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: typeof QrCode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-line">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black uppercase text-black/45">{label}</p>
          <p className="mt-1 text-lg font-black">{value}</p>
          <p className="mt-1 text-sm leading-6 text-black/60">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function metricIcon(label: string) {
  if (label.includes("QR")) return QrCode;
  if (label.includes("Lot")) return Boxes;
  if (label.includes("Tournee")) return Route;
  if (label.includes("Voyage")) return Plane;
  if (label.includes("Stock")) return Truck;
  return CheckCircle2;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    currency,
    style: "currency",
  }).format(amountCents / 100);
}
