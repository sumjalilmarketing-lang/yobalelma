import Link from "next/link";
import { ExperienceSettingsPanel } from "@/components/settings/experience-settings-panel";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Camera,
  CheckCircle2,
  FileDown,
  History,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import {
  getAnomaly,
  getBatch,
  getCompatibleShipments,
  getHubSnapshot,
  getInventoryByShipment,
  getManifest,
  getShipment,
  getTrip,
  statusTone,
} from "../lib/hub-store";
import type { HubState } from "../lib/hub-store";
import type {
  HubBatch,
  HubRouteKind,
  HubSession,
  InboundManifest,
  Shipment,
  TravelerTrip,
} from "../lib/types";
import { ActionButton, Badge, EmptyState, Field, KpiIcon, PageHeader, Panel, inputClass, selectClass, submitClass } from "./hub-ui";
import type { EnterpriseHubState } from "../lib/enterprise-types";
import { EnterpriseDashboard, EnterprisePage } from "./enterprise-pages";

export function HubRoutePage({
  hubState,
  enterpriseState,
  segments,
  session,
}: {
  hubState: HubState;
  enterpriseState: EnterpriseHubState;
  segments?: string[];
  session: HubSession;
}) {
  const route = resolveRoute(segments ?? []);

  if (["controlTower", "agents", "search", "incidents", "alerts", "stockMonitoring", "forecast", "systemHealth", "audit", "reports", "exports", "documents"].includes(route.kind)) {
    return <EnterprisePage kind={route.kind as "controlTower" | "agents" | "search" | "incidents" | "alerts" | "stockMonitoring" | "forecast" | "systemHealth" | "audit" | "reports" | "exports" | "documents"} session={session} state={enterpriseState} />;
  }

  switch (route.kind) {
    case "dashboard":
      return <DashboardPage enterpriseState={enterpriseState} state={hubState} />;
    case "inbound":
      return <InboundPage state={hubState} />;
    case "inboundDetail":
      return <InboundDetailPage manifestId={route.id} state={hubState} />;
    case "scanner":
      return <ScannerPage state={hubState} />;
    case "inspection":
      return <InspectionPage state={hubState} />;
    case "inspectionDetail":
      return <InspectionDetailPage shipmentId={route.id} state={hubState} />;
    case "inventory":
      return <InventoryPage state={hubState} />;
    case "inventoryDetail":
      return <InventoryDetailPage shipmentId={route.id} state={hubState} />;
    case "storage":
      return <StoragePage state={hubState} />;
    case "storageLocations":
      return <StorageLocationsPage state={hubState} />;
    case "trips":
      return <TripsPage state={hubState} />;
    case "tripDetail":
      return <TripDetailPage state={hubState} tripId={route.id} />;
    case "capacities":
      return <CapacitiesPage state={hubState} />;
    case "batches":
      return <BatchesPage state={hubState} />;
    case "batchNew":
      return <BatchNewPage state={hubState} />;
    case "batchDetail":
      return <BatchDetailPage batchId={route.id} state={hubState} />;
    case "handover":
      return <HandoverPage state={hubState} />;
    case "handoverDetail":
      return <HandoverDetailPage batchId={route.id} state={hubState} />;
    case "anomalies":
      return <AnomaliesPage state={hubState} />;
    case "anomalyDetail":
      return <AnomalyDetailPage anomalyId={route.id} state={hubState} />;
    case "history":
      return <HistoryPage state={hubState} />;
    case "reports":
      return <ReportsPage state={hubState} />;
    case "notifications":
      return <NotificationsPage state={hubState} />;
    case "profile":
      return <ProfilePage session={session} />;
    case "settings":
      return <SettingsPage session={session} />;
    default:
      return (
        <EmptyState
          actionHref="/hub"
          actionLabel="Retour au Hub"
          message="Cette route Hub n'existe pas dans le perimetre operationnel."
          title="Route introuvable"
        />
      );
  }
}

function resolveRoute(segments: string[]): { id: string; kind: HubRouteKind } {
  const [first, second] = segments;

  if (!first) return { id: "", kind: "dashboard" };
  if (first === "inbound" && second) return { id: second, kind: "inboundDetail" };
  if (first === "inspection" && second) return { id: second, kind: "inspectionDetail" };
  if (first === "inventory" && second) return { id: second, kind: "inventoryDetail" };
  if (first === "storage" && second === "locations") return { id: "", kind: "storageLocations" };
  if (first === "trips" && second) return { id: second, kind: "tripDetail" };
  if (first === "batches" && second === "new") return { id: "", kind: "batchNew" };
  if (first === "batches" && second) return { id: second, kind: "batchDetail" };
  if (first === "handover" && second) return { id: second, kind: "handoverDetail" };
  if (first === "anomalies" && second) return { id: second, kind: "anomalyDetail" };

  const exact: Record<string, HubRouteKind> = {
    agents: "agents",
    alerts: "alerts",
    audit: "audit",
    anomalies: "anomalies",
    batches: "batches",
    capacities: "capacities",
    "control-tower": "controlTower",
    documents: "documents",
    exports: "exports",
    forecast: "forecast",
    handover: "handover",
    history: "history",
    inbound: "inbound",
    incidents: "incidents",
    inspection: "inspection",
    inventory: "inventory",
    notifications: "notifications",
    profile: "profile",
    reports: "reports",
    search: "search",
    scanner: "scanner",
    settings: "settings",
    storage: "storage",
    "stock-monitoring": "stockMonitoring",
    "system-health": "systemHealth",
    trips: "trips",
  };

  return { id: "", kind: exact[first] ?? "notFound" };
}

function DashboardPage({ enterpriseState, state }: { enterpriseState: EnterpriseHubState; state: HubState }) {
  const snapshot = getHubSnapshot(state);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <>
            <ActionButton href="/hub/scanner">Scanner</ActionButton>
            <ActionButton href="/hub/batches/new" tone="secondary">Nouveau lot</ActionButton>
          </>
        }
        eyebrow="Operations temps reel"
        subtitle="Vue consolidee des receptions, stocks, capacites voyageurs, lots et anomalies du Hub."
        title="Centre operationnel Hub"
      />
      <EnterpriseDashboard state={enterpriseState} />
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {snapshot.kpis.map((kpi) => (
          <Panel key={kpi.key}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{kpi.label}</p>
                <p className="mt-2 text-3xl font-black">{kpi.value}</p>
              </div>
              <span className="rounded-md bg-primary/10 p-2 text-primary">
                <KpiIcon name={kpi.key} />
              </span>
            </div>
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Taches prioritaires">
          <div className="grid gap-2">
            {snapshot.priorityTasks.map((task) => (
              <Link
                className="flex items-center justify-between rounded-md border border-black/10 bg-muted/35 p-3 text-sm font-bold transition hover:border-primary hover:bg-primary/10"
                href={task.href}
                key={task.href}
              >
                <span>{task.label}</span>
                <Badge tone={task.tone}>ouvrir</Badge>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Activite recente">
          <Timeline state={state} />
        </Panel>
      </div>
      <ReportsStrip state={state} />
    </div>
  );
}

function InboundPage({ state }: { state: HubState }) {
  const { manifests } = state;

  return (
    <div className="space-y-5">
      <PageHeader
        actions={<ActionButton href="/hub/scanner">Scanner un colis</ActionButton>}
        eyebrow="Collectes entrantes"
        subtitle="Receptionner les manifestes, rapprocher les colis attendus et tracer les ecarts."
        title="Reception des collectes"
      />
      <Panel title="Manifestes">
        <Table
          rows={manifests.map((manifest) => [
            <Link className="font-black text-primary" href={`/hub/inbound/${manifest.id}`} key="id">{manifest.id}</Link>,
            manifest.collectionVehicle,
            manifest.collectionDriver,
            manifest.relayStops.map((stop) => stop.relayName).join(", "),
            <Badge key="status" tone={statusTone(manifest.status)}>{manifest.status}</Badge>,
            `${manifest.items.length} colis`,
          ])}
          headers={["Manifeste", "Vehicule", "Chauffeur", "Relais", "Statut", "Volume"]}
        />
      </Panel>
    </div>
  );
}

function InboundDetailPage({ manifestId, state }: { manifestId: string; state: HubState }) {
  const manifest = getManifest(manifestId, state);

  if (!manifest) {
    return <EmptyState actionHref="/hub/inbound" actionLabel="Voir les manifestes" message="Le manifeste demande n'est pas disponible." title="Manifeste introuvable" />;
  }

  const summary = summarizeInbound(manifest);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={<ActionButton href="/hub/scanner">Mode scanner</ActionButton>}
        eyebrow={manifest.collectionVehicle}
        subtitle={`Chauffeur ${manifest.collectionDriver} - ${manifest.relayStops.length} relais visites.`}
        title={`Manifeste ${manifest.id}`}
      />
      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(summary).map(([key, value]) => (
          <Panel key={key}>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{key}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </Panel>
        ))}
      </div>
      <Panel
        action={
          <form action="/api/hub/inbound/confirm" method="post">
            <input name="manifestId" type="hidden" value={manifest.id} />
            <input name="returnTo" type="hidden" value={`/hub/inbound/${manifest.id}`} />
            <button className={submitClass} type="submit">Confirmer</button>
          </form>
        }
        title="Colis du manifeste"
      >
        <div className="grid gap-3">
          {manifest.items.map((item) => (
            <form action="/api/hub/inbound/scan" className="grid gap-3 rounded-md border border-black/10 bg-muted/30 p-3 lg:grid-cols-[1fr_180px_1fr_auto]" key={item.trackingCode} method="post">
              <input name="manifestId" type="hidden" value={manifest.id} />
              <input name="trackingCode" type="hidden" value={item.trackingCode} />
              <input name="returnTo" type="hidden" value={`/hub/inbound/${manifest.id}`} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">{item.trackingCode}</p>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.destinationCity}, {item.destinationCountry} - {item.weightKg} kg</p>
              </div>
              <select className={selectClass} name="status" defaultValue={item.status}>
                <option value="received_at_hub">Recu</option>
                <option value="missing_at_hub">Manquant</option>
                <option value="damaged_at_hub">Endommage</option>
                <option value="quarantined_at_hub">Quarantaine</option>
                <option value="extra_at_hub">Supplementaire</option>
              </select>
              <input className={inputClass} name="note" placeholder="Justification si ecart" defaultValue={item.conditionNote} />
              <button className={submitClass} type="submit">Enregistrer</button>
            </form>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ScannerPage({ state }: { state: HubState }) {
  const { manifests } = state;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Scan rapide"
        subtitle="Enregistrer un scan de reception avec justification obligatoire pour chaque ecart."
        title="Scanner Hub"
      />
      <Panel title="Nouveau scan">
        <form action="/api/hub/inbound/scan" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="post">
          <Field label="Manifeste">
            <select className={selectClass} name="manifestId">
              {manifests.map((manifest) => (
                <option key={manifest.id} value={manifest.id}>{manifest.id}</option>
              ))}
            </select>
          </Field>
          <Field label="Tracking">
            <input className={inputClass} name="trackingCode" placeholder="YBL-DSS-CDG-001" />
          </Field>
          <Field label="Statut">
            <select className={selectClass} name="status">
              <option value="received_at_hub">Recu</option>
              <option value="missing_at_hub">Manquant</option>
              <option value="damaged_at_hub">Endommage</option>
              <option value="extra_at_hub">Supplementaire</option>
            </select>
          </Field>
          <Field label="Note">
            <input className={inputClass} name="note" placeholder="Justification" />
          </Field>
          <div className="flex items-end">
            <input name="returnTo" type="hidden" value="/hub/scanner" />
            <button className={submitClass} type="submit"><ScanLine className="mr-2 h-4 w-4" />Scanner</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function InspectionPage({ state }: { state: HubState }) {
  const { inventory, shipments } = state;
  const candidates = inventory
    .filter((item) => ["inspection_required", "damaged", "quarantined"].includes(item.status))
    .map((item) => shipments.find((shipment) => shipment.id === item.shipmentId))
    .filter(Boolean) as Shipment[];

  return (
    <ListPage
      actionHref="/hub/scanner"
      actionLabel="Scanner"
      emptyMessage="Aucun colis n'attend une inspection."
      headers={["Tracking", "Destination", "Poids declare", "Priorite", "Action"]}
      rows={candidates.map((shipment) => [
        shipment.trackingCode,
        `${shipment.destinationCity}, ${shipment.destinationCountry}`,
        `${shipment.declaredWeightKg} kg`,
        <Badge key="priority" tone={statusTone(shipment.priority)}>{shipment.priority}</Badge>,
        <Link className="font-black text-primary" href={`/hub/inspection/${shipment.id}`} key="link">Inspecter</Link>,
      ])}
      subtitle="Controler poids, dimensions, emballage, risque et decision humaine."
      title="Inspection des colis"
    />
  );
}

function InspectionDetailPage({ shipmentId, state }: { shipmentId: string; state: HubState }) {
  const shipment = getShipment(shipmentId, state);

  if (!shipment) {
    return <EmptyState actionHref="/hub/inspection" actionLabel="Retour inspection" message="Le colis demande est introuvable." title="Colis introuvable" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={shipment.trackingCode}
        subtitle={`${shipment.senderName} vers ${shipment.recipientName}, ${shipment.destinationCity}.`}
        title="Inspection colis"
      />
      <Panel title="Decision d'inspection">
        <form action="/api/hub/inspection" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="post">
          <input name="shipmentId" type="hidden" value={shipment.id} />
          <input name="returnTo" type="hidden" value={`/hub/inspection/${shipment.id}`} />
          <Field label="Poids declare">
            <input className={inputClass} readOnly value={`${shipment.declaredWeightKg} kg`} />
          </Field>
          <Field label="Poids reel">
            <input className={inputClass} name="measuredWeightKg" type="number" step="0.1" defaultValue={shipment.declaredWeightKg} />
          </Field>
          <Field label="Emballage">
            <select className={selectClass} name="packagingQuality" defaultValue="acceptable">
              <option value="excellent">Excellent</option>
              <option value="acceptable">Acceptable</option>
              <option value="weak">Faible</option>
              <option value="non_compliant">Non conforme</option>
            </select>
          </Field>
          <Field label="Decision">
            <select className={selectClass} name="decision" defaultValue="approved">
              <option value="approved">Approuve</option>
              <option value="repackaging_required">Reconditionnement</option>
              <option value="customer_confirmation_required">Confirmation client</option>
              <option value="blocked">Bloque</option>
              <option value="rejected">Rejete</option>
              <option value="quarantined">Quarantaine</option>
            </select>
          </Field>
          <Field label="Note agent">
            <input className={inputClass} name="note" placeholder="Observation" />
          </Field>
          <button className={submitClass} type="submit"><Camera className="mr-2 h-4 w-4" />Enregistrer</button>
        </form>
      </Panel>
    </div>
  );
}

function InventoryPage({ state }: { state: HubState }) {
  const { inventory, shipments, storageLocations } = state;

  return (
    <ListPage
      actionHref="/hub/storage/locations"
      actionLabel="Emplacements"
      emptyMessage="Aucun colis actif dans l'inventaire."
      headers={["Tracking", "Statut", "Emplacement", "Poids", "Destination", "Action"]}
      rows={inventory.filter((item) => item.active).map((item) => {
        const shipment = shipments.find((candidate) => candidate.id === item.shipmentId);
        const location = storageLocations.find((candidate) => candidate.id === item.locationId);

        return [
          shipment?.trackingCode ?? item.shipmentId,
          <Badge key="status" tone={statusTone(item.status)}>{item.status}</Badge>,
          location?.code ?? "Non affecte",
          `${item.measuredWeightKg} kg`,
          shipment ? `${shipment.destinationCity}, ${shipment.destinationCountry}` : "-",
          <Link className="font-black text-primary" href={`/hub/inventory/${item.shipmentId}`} key="link">Details</Link>,
        ];
      })}
      subtitle="Localiser chaque colis actif, verifier le stock systeme et tracer les mouvements."
      title="Inventaire Hub"
    />
  );
}

function InventoryDetailPage({ shipmentId, state }: { shipmentId: string; state: HubState }) {
  const shipment = getShipment(shipmentId, state);
  const inventory = shipment ? getInventoryByShipment(shipment.id, state) : null;
  const { storageLocations, trackingEvents } = state;

  if (!shipment || !inventory) {
    return <EmptyState actionHref="/hub/inventory" actionLabel="Retour inventaire" message="Le colis n'a pas d'inventaire actif." title="Inventaire introuvable" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={shipment.trackingCode}
        subtitle={`${shipment.destinationCity}, ${shipment.destinationCountry} - ${inventory.measuredWeightKg} kg.`}
        title="Fiche inventaire"
      />
      <Panel title="Deplacement">
        <form action="/api/hub/storage/move" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="post">
          <input name="shipmentId" type="hidden" value={shipment.id} />
          <input name="returnTo" type="hidden" value={`/hub/inventory/${shipment.id}`} />
          <Field label="Nouvel emplacement">
            <select className={selectClass} name="toLocationId" defaultValue={inventory.locationId}>
              {storageLocations.map((location) => (
                <option key={location.id} value={location.id}>{location.code} - {location.zone}</option>
              ))}
            </select>
          </Field>
          <Field label="Statut">
            <select className={selectClass} name="status" defaultValue={inventory.status}>
              <option value="in_storage">En stockage</option>
              <option value="picked_for_batch">Preleve pour lot</option>
              <option value="quarantined">Quarantaine</option>
              <option value="damaged">Endommage</option>
            </select>
          </Field>
          <Field label="Note">
            <input className={inputClass} name="note" placeholder="Motif du mouvement" />
          </Field>
          <div className="flex items-end">
            <button className={submitClass} type="submit"><MapPin className="mr-2 h-4 w-4" />Deplacer</button>
          </div>
        </form>
      </Panel>
      <Panel title="Tracking">
        <div className="grid gap-2">
          {trackingEvents.filter((event) => event.shipmentId === shipment.id).map((event) => (
            <div className="rounded-md border border-black/10 p-3" key={event.id}>
              <p className="font-black">{event.status}</p>
              <p className="text-sm text-muted-foreground">{event.note}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StoragePage({ state }: { state: HubState }) {
  const { storageLocations } = state;

  return (
    <div className="space-y-5">
      <PageHeader
        actions={<ActionButton href="/hub/storage/locations">Voir les emplacements</ActionButton>}
        eyebrow="Plan de stockage"
        subtitle="Zones reception, inspection, stockage, quarantaine et preparation."
        title="Stockage Hub"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {storageLocations.map((location) => (
          <Panel key={location.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-black">{location.code}</p>
                <p className="text-sm text-muted-foreground">{location.zone} - Allee {location.aisle} - {location.shelf}</p>
              </div>
              <Badge tone={location.type === "quarantine" ? "danger" : "neutral"}>{location.type}</Badge>
            </div>
            <div className="mt-4 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.min((location.occupiedWeightKg / location.maxWeightKg) * 100, 100)}%` }}
              />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function StorageLocationsPage({ state }: { state: HubState }) {
  const { storageLocations } = state;

  return (
    <ListPage
      emptyMessage="Aucun emplacement configure."
      headers={["Code", "Zone", "Allee", "Rayon", "Type", "Charge"]}
      rows={storageLocations.map((location) => [
        location.code,
        location.zone,
        location.aisle,
        location.shelf,
        <Badge key="type" tone={location.type === "quarantine" ? "danger" : "neutral"}>{location.type}</Badge>,
        `${location.occupiedWeightKg}/${location.maxWeightKg} kg`,
      ])}
      subtitle="Configuration active des zones physiques du Hub."
      title="Emplacements"
    />
  );
}

function TripsPage({ state }: { state: HubState }) {
  const { trips } = state;

  return (
    <TripList
      rows={trips}
      subtitle="Voyageurs valides, billets, vols et capacites disponibles pour les lots."
      title="Voyages disponibles"
    />
  );
}

function TripDetailPage({ tripId, state }: { tripId: string; state: HubState }) {
  const trip = getTrip(tripId, state);

  if (!trip) {
    return <EmptyState actionHref="/hub/trips" actionLabel="Voir les voyages" message="Le voyage demande est introuvable." title="Voyage introuvable" />;
  }

  const compatible = getCompatibleShipments(trip.id, state);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={<ActionButton href="/hub/batches/new">Creer un lot</ActionButton>}
        eyebrow={`${trip.airline} ${trip.flightNumber}`}
        subtitle={`${trip.departureAirport} vers ${trip.arrivalAirport}, capacite restante ${(trip.capacityKg - trip.reservedKg).toFixed(1)} kg.`}
        title={`${trip.arrivalCity}, ${trip.arrivalCountry}`}
      />
      <Panel title="Colis compatibles">
        {compatible.length ? (
          <Table
            headers={["Tracking", "Poids", "Priorite", "Action"]}
            rows={compatible.map((shipment) => [
              shipment.trackingCode,
              `${shipment.declaredWeightKg} kg`,
              <Badge key="priority" tone={statusTone(shipment.priority)}>{shipment.priority}</Badge>,
              <Link className="font-black text-primary" href={`/hub/inventory/${shipment.id}`} key="link">Ouvrir</Link>,
            ])}
          />
        ) : (
          <EmptyState message="Aucun colis en stockage ne correspond actuellement a ce voyage." title="Aucune compatibilite" />
        )}
      </Panel>
    </div>
  );
}

function CapacitiesPage({ state }: { state: HubState }) {
  const { trips } = state;

  return <TripList rows={trips} subtitle="Surveiller capacite totale, reservee et restante par vol." title="Capacites voyageurs" />;
}

function BatchesPage({ state }: { state: HubState }) {
  const { batches } = state;

  return (
    <ListPage
      actionHref="/hub/batches/new"
      actionLabel="Nouveau lot"
      emptyMessage="Aucun lot Hub n'est actif."
      headers={["Lot", "Destination", "Statut", "Poids", "Colis", "Action"]}
      rows={batches.map((batch) => batchRow(batch))}
      subtitle="Preparer, reserver, valider et remettre les lots aux voyageurs."
      title="Lots logistiques"
    />
  );
}

function BatchNewPage({ state }: { state: HubState }) {
  const { trips } = state;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Preparation lot" subtitle="Selectionner un voyage valide et reserver les colis compatibles." title="Nouveau lot" />
      <Panel title="Creer un lot">
        <form action="/api/hub/batches" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" method="post">
          <input name="returnTo" type="hidden" value="/hub/batches" />
          <Field label="Voyage">
            <select className={selectClass} name="tripId">
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>{trip.flightNumber} - {trip.arrivalCity} - reste {(trip.capacityKg - trip.reservedKg).toFixed(1)} kg</option>
              ))}
            </select>
          </Field>
          <Field label="Colis optionnels">
            <input className={inputClass} name="shipmentIds" placeholder="shp-002, shp-006" />
          </Field>
          <div className="flex items-end">
            <button className={submitClass} type="submit"><Boxes className="mr-2 h-4 w-4" />Creer</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function BatchDetailPage({ batchId, state }: { batchId: string; state: HubState }) {
  const batch = getBatch(batchId, state);

  if (!batch) {
    return <EmptyState actionHref="/hub/batches" actionLabel="Voir les lots" message="Le lot demande est introuvable." title="Lot introuvable" />;
  }

  const trip = getTrip(batch.tripId, state);
  const compatible = trip ? getCompatibleShipments(trip.id, state) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        actions={<ActionButton href={`/hub/handover/${batch.id}`}>Remise</ActionButton>}
        eyebrow={batch.batchCode}
        subtitle={`${batch.destinationCity}, ${batch.destinationCountry} - ${batch.totalWeightKg.toFixed(1)} kg reserves.`}
        title="Lot Hub"
      />
      <div className="grid gap-3 md:grid-cols-4">
        <Panel><p className="text-xs font-black text-muted-foreground">Statut</p><p className="mt-2"><Badge tone={statusTone(batch.status)}>{batch.status}</Badge></p></Panel>
        <Panel><p className="text-xs font-black text-muted-foreground">Colis</p><p className="mt-2 text-3xl font-black">{batch.shipmentIds.length}</p></Panel>
        <Panel><p className="text-xs font-black text-muted-foreground">Poids</p><p className="mt-2 text-3xl font-black">{batch.totalWeightKg.toFixed(1)} kg</p></Panel>
        <Panel><p className="text-xs font-black text-muted-foreground">Voyageur</p><p className="mt-2 font-black">{trip?.travelerName}</p></Panel>
      </div>
      <Panel title="Reservation capacite">
        <form action="/api/hub/batches/reserve" className="grid gap-4 md:grid-cols-3" method="post">
          <input name="batchId" type="hidden" value={batch.id} />
          <input name="returnTo" type="hidden" value={`/hub/batches/${batch.id}`} />
          <Field label="Colis compatible">
            <select className={selectClass} name="shipmentId">
              {compatible.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>{shipment.trackingCode} - {shipment.declaredWeightKg} kg</option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button className={submitClass} type="submit">Reserver</button>
          </div>
        </form>
      </Panel>
      <Panel
        action={
          <form action="/api/hub/batches/qr" method="post">
            <input name="batchId" type="hidden" value={batch.id} />
            <input name="returnTo" type="hidden" value={`/hub/batches/${batch.id}`} />
            <button className={submitClass} type="submit"><QrCode className="mr-2 h-4 w-4" />Generer QR</button>
          </form>
        }
        title="Colis du lot"
      >
        <Table
          headers={["Tracking", "Destination", "Poids", "Statut"]}
          rows={batch.shipmentIds.map((shipmentId) => {
            const shipment = state.shipments.find((candidate) => candidate.id === shipmentId);
            const inventory = shipment ? getInventoryByShipment(shipment.id, state) : null;
            return [
              shipment?.trackingCode ?? shipmentId,
              shipment ? `${shipment.destinationCity}, ${shipment.destinationCountry}` : "-",
              `${inventory?.measuredWeightKg ?? shipment?.declaredWeightKg ?? 0} kg`,
              <Badge key="status" tone={statusTone(shipment?.status ?? "neutral")}>{shipment?.status ?? "-"}</Badge>,
            ];
          })}
        />
      </Panel>
      {batch.pickupQr ? (
        <Panel title="QR de retrait">
          <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
            <div className="flex aspect-square items-center justify-center rounded-lg border border-black/10 bg-white text-primary">
              <QrCode className="h-24 w-24" />
            </div>
            <div>
              <p className="text-sm font-black">Token opaque</p>
              <p className="mt-1 break-all rounded-md bg-muted p-3 text-xs font-bold">{batch.pickupQr.token}</p>
              <p className="mt-3 text-sm text-muted-foreground">Expire le {formatDate(batch.pickupQr.expiresAt)}. Usage unique, lie au lot, au Hub, au voyageur et au vol.</p>
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function HandoverPage({ state }: { state: HubState }) {
  const { batches } = state;
  const ready = batches.filter((batch) => ["ready", "pickup_qr_generated"].includes(batch.status));

  return (
    <ListPage
      emptyMessage="Aucun lot pret pour remise."
      headers={["Lot", "Destination", "Statut", "Deadline", "Action"]}
      rows={ready.map((batch) => [
        batch.batchCode,
        `${batch.destinationCity}, ${batch.destinationCountry}`,
        <Badge key="status" tone={statusTone(batch.status)}>{batch.status}</Badge>,
        formatDate(batch.handoverDeadlineAt),
        <Link className="font-black text-primary" href={`/hub/handover/${batch.id}`} key="link">Remettre</Link>,
      ])}
      subtitle="Verifier QR, identite, billet, poids et signature avant remise."
      title="Remise au voyageur"
    />
  );
}

function HandoverDetailPage({ batchId, state }: { batchId: string; state: HubState }) {
  const batch = getBatch(batchId, state);

  if (!batch) {
    return <EmptyState actionHref="/hub/handover" actionLabel="Voir remises" message="Le lot demande est introuvable." title="Lot introuvable" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={batch.batchCode} subtitle="Validation finale avant transfert de responsabilite au voyageur." title="Remise voyageur" />
      <Panel title="Controle remise">
        <form action="/api/hub/handover" className="grid gap-4 md:grid-cols-2" method="post">
          <input name="batchId" type="hidden" value={batch.id} />
          <input name="returnTo" type="hidden" value={`/hub/handover/${batch.id}`} />
          <Field label="Token QR">
            <input className={inputClass} name="token" defaultValue={batch.pickupQr?.token ?? ""} placeholder="Token opaque" />
          </Field>
          <Field label="Poids remis">
            <input className={inputClass} name="measuredWeightKg" type="number" step="0.1" defaultValue={batch.totalWeightKg} />
          </Field>
          <label className="flex items-center gap-2 rounded-md border border-black/10 p-3 text-sm font-black"><input name="verifiedIdentity" type="checkbox" value="true" />Identite verifiee</label>
          <label className="flex items-center gap-2 rounded-md border border-black/10 p-3 text-sm font-black"><input name="verifiedDocument" type="checkbox" value="true" />KYC/document verifie</label>
          <label className="flex items-center gap-2 rounded-md border border-black/10 p-3 text-sm font-black"><input name="verifiedTicket" type="checkbox" value="true" />Billet et vol verifies</label>
          <Field label="Note">
            <input className={inputClass} name="note" placeholder="Signature et controle OK" />
          </Field>
          <button className={submitClass} type="submit"><CheckCircle2 className="mr-2 h-4 w-4" />Confirmer remise</button>
        </form>
      </Panel>
    </div>
  );
}

function AnomaliesPage({ state }: { state: HubState }) {
  const { anomalies } = state;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Qualite operationnelle" subtitle="Creer, assigner, escalader et resoudre les anomalies Hub." title="Centre anomalies" />
      <Panel title="Nouvelle anomalie">
        <form action="/api/hub/anomalies" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="post">
          <input name="returnTo" type="hidden" value="/hub/anomalies" />
          <Field label="Type">
            <select className={selectClass} name="type">
              <option value="missing_package">Colis manquant</option>
              <option value="damaged_package">Colis endommage</option>
              <option value="wrong_weight">Poids incorrect</option>
              <option value="capacity_mismatch">Capacite</option>
              <option value="qr_issue">QR</option>
            </select>
          </Field>
          <Field label="Priorite">
            <select className={selectClass} name="priority" defaultValue="medium">
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
              <option value="critical">Critique</option>
            </select>
          </Field>
          <Field label="Titre">
            <input className={inputClass} name="title" placeholder="Titre" />
          </Field>
          <Field label="Description">
            <input className={inputClass} name="description" placeholder="Details" />
          </Field>
          <div className="flex items-end">
            <button className={submitClass} type="submit"><AlertTriangle className="mr-2 h-4 w-4" />Creer</button>
          </div>
        </form>
      </Panel>
      <Panel title="Anomalies ouvertes">
        <Table
          headers={["Titre", "Type", "Priorite", "Statut", "Action"]}
          rows={anomalies.map((anomaly) => [
            anomaly.title,
            anomaly.type,
            <Badge key="priority" tone={statusTone(anomaly.priority)}>{anomaly.priority}</Badge>,
            <Badge key="status" tone={statusTone(anomaly.status)}>{anomaly.status}</Badge>,
            <Link className="font-black text-primary" href={`/hub/anomalies/${anomaly.id}`} key="link">Ouvrir</Link>,
          ])}
        />
      </Panel>
    </div>
  );
}

function AnomalyDetailPage({ anomalyId, state }: { anomalyId: string; state: HubState }) {
  const anomaly = getAnomaly(anomalyId, state);

  if (!anomaly) {
    return <EmptyState actionHref="/hub/anomalies" actionLabel="Voir anomalies" message="L'anomalie demandee est introuvable." title="Anomalie introuvable" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={anomaly.type} subtitle={anomaly.description} title={anomaly.title} />
      <Panel
        action={
          <form action="/api/hub/anomalies" method="post">
            <input name="id" type="hidden" value={anomaly.id} />
            <input name="intent" type="hidden" value="resolve" />
            <input name="returnTo" type="hidden" value={`/hub/anomalies/${anomaly.id}`} />
            <button className={submitClass} type="submit">Resoudre</button>
          </form>
        }
        title="Statut"
      >
        <div className="grid gap-3 md:grid-cols-4">
          <Badge tone={statusTone(anomaly.status)}>{anomaly.status}</Badge>
          <Badge tone={statusTone(anomaly.priority)}>{anomaly.priority}</Badge>
          <Badge tone={anomaly.blocksShipment ? "danger" : "success"}>{anomaly.blocksShipment ? "Colis bloque" : "Colis libre"}</Badge>
          <Badge tone={anomaly.blocksPayout ? "danger" : "success"}>{anomaly.blocksPayout ? "Payout bloque" : "Payout libre"}</Badge>
        </div>
      </Panel>
    </div>
  );
}

function HistoryPage({ state }: { state: HubState }) {
  return (
    <ListPage
      emptyMessage="Aucun evenement d'audit."
      headers={["Date", "Action", "Entite", "Acteur"]}
      rows={state.auditEvents.slice().reverse().map((event) => [
        formatDate(event.at),
        event.action,
        `${event.entityType}:${event.entityId}`,
        event.actor,
      ])}
      subtitle="Toutes les actions critiques du Hub sont auditees."
      title="Audit logs"
    />
  );
}

function ReportsPage({ state }: { state: HubState }) {
  return (
    <div className="space-y-5">
      <PageHeader
        actions={<ActionButton href="/api/hub/reports?format=csv">Exporter CSV</ActionButton>}
        eyebrow="Performance Hub"
        subtitle="Rapports journalier, hebdomadaire et operationnels pour la supervision."
        title="Rapports"
      />
      <ReportsStrip state={state} />
      <Panel title="Indicateurs">
        <Table
          headers={["Rapport", "Valeur", "Unite", "Tendance"]}
          rows={state.reports.map((report) => [report.label, String(report.value), report.unit, report.trend])}
        />
      </Panel>
    </div>
  );
}

function NotificationsPage({ state }: { state: HubState }) {
  return (
    <ListPage
      emptyMessage="Aucune notification active."
      headers={["Titre", "Message", "Priorite", "Date"]}
      rows={state.notifications.map((item) => [
        item.title,
        item.message,
        <Badge key="priority" tone={statusTone(item.priority)}>{item.priority}</Badge>,
        formatDate(item.at),
      ])}
      subtitle="Alertes prioritaires, remises a venir et incidents ouverts."
      title="Notifications"
    />
  );
}

function ProfilePage({ session }: { session: HubSession }) {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={session.role} subtitle={session.email} title={session.name} />
      <Panel title="Profil operationnel">
        <div className="grid gap-3 md:grid-cols-3">
          <Badge tone="success">Hub {session.hubId}</Badge>
          <Badge tone="info">Session signee</Badge>
          <Badge tone="neutral">Expiration {formatDate(session.expiresAt)}</Badge>
        </div>
      </Panel>
    </div>
  );
}

function SettingsPage({ session }: { session: HubSession }) {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Configuration" subtitle="Seuils poids, securite QR, zones et supervision." title="Parametres Hub" />
      <Panel title="Regles actives">
        <div className="grid gap-3 md:grid-cols-3">
          <Rule icon={<ScaleIcon />} label="Alerte poids" value="5%" />
          <Rule icon={<ScaleIcon />} label="Blocage poids" value="15%" />
          <Rule icon={<ShieldCheck className="h-5 w-5" />} label="Role autorise" value={session.role} />
        </div>
      </Panel>
      <ExperienceSettingsPanel />
    </div>
  );
}

function TripList({ rows, subtitle, title }: { rows: TravelerTrip[]; subtitle: string; title: string }) {
  return (
    <ListPage
      emptyMessage="Aucun voyageur valide disponible."
      headers={["Vol", "Voyageur", "Destination", "KYC", "Capacite", "Action"]}
      rows={rows.map((trip) => [
        `${trip.airline} ${trip.flightNumber}`,
        trip.travelerName,
        `${trip.arrivalCity}, ${trip.arrivalCountry}`,
        <Badge key="kyc" tone={trip.kycStatus === "verified" ? "success" : "warning"}>{trip.kycStatus}</Badge>,
        `${(trip.capacityKg - trip.reservedKg).toFixed(1)} / ${trip.capacityKg} kg`,
        <Link className="font-black text-primary" href={`/hub/trips/${trip.id}`} key="link">Ouvrir</Link>,
      ])}
      subtitle={subtitle}
      title={title}
    />
  );
}

function ListPage({
  actionHref,
  actionLabel,
  emptyMessage,
  headers,
  rows,
  subtitle,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  emptyMessage: string;
  headers: string[];
  rows: React.ReactNode[][];
  subtitle: string;
  title: string;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        actions={actionHref && actionLabel ? <ActionButton href={actionHref}>{actionLabel}</ActionButton> : undefined}
        eyebrow="Hub operations"
        subtitle={subtitle}
        title={title}
      />
      <Panel title={title}>
        {rows.length ? <Table headers={headers} rows={rows} /> : <EmptyState message={emptyMessage} title="Aucune donnee" />}
      </Panel>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th className="border-b border-black/10 px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="transition hover:bg-primary/5" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="border-b border-black/5 px-3 py-3 font-semibold" key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportsStrip({ state }: { state: HubState }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {state.reports.map((report) => (
        <Panel key={report.label}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{report.label}</p>
              <p className="mt-2 text-3xl font-black">{report.value}<span className="ml-1 text-sm text-muted-foreground">{report.unit}</span></p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 text-xs font-black text-success">{report.trend}</p>
        </Panel>
      ))}
    </div>
  );
}

function Timeline({ state }: { state: HubState }) {
  const events = state.auditEvents.slice().reverse().slice(0, 6);

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <div className="flex gap-3" key={event.id}>
          <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><History className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-black">{event.action}</p>
            <p className="text-xs text-muted-foreground">{event.actor} - {formatDate(event.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function batchRow(batch: HubBatch): React.ReactNode[] {
  return [
    batch.batchCode,
    `${batch.destinationCity}, ${batch.destinationCountry}`,
    <Badge key="status" tone={statusTone(batch.status)}>{batch.status}</Badge>,
    `${batch.totalWeightKg.toFixed(1)} kg`,
    String(batch.shipmentIds.length),
    <Link className="font-black text-primary" href={`/hub/batches/${batch.id}`} key="link">Ouvrir</Link>,
  ];
}

function summarizeInbound(manifest: InboundManifest) {
  return {
    attendus: manifest.items.filter((item) => item.status !== "extra_at_hub").length,
    recus: manifest.items.filter((item) => item.status === "received_at_hub").length,
    manquants: manifest.items.filter((item) => item.status === "missing_at_hub").length,
    endommages: manifest.items.filter((item) => item.status === "damaged_at_hub").length,
    ecarts: manifest.items.filter((item) => ["missing_at_hub", "damaged_at_hub", "extra_at_hub", "quarantined_at_hub"].includes(item.status)).length,
  };
}

function Rule({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-black/10 bg-muted/35 p-4">
      <span className="text-primary">{icon}</span>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function ScaleIcon() {
  return <FileDown className="h-5 w-5" />;
}

function formatDate(value: string | number) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
