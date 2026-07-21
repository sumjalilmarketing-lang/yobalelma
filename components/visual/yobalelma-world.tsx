import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  CircleDot,
  Compass,
  Globe2,
  MapPin,
  PackageCheck,
  Plane,
  RadioTower,
  ScanLine,
  ShieldCheck,
  Store,
  Truck,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type JourneyScene =
  | "home"
  | "client"
  | "transporter"
  | "traveler"
  | "hub"
  | "relay"
  | "admin"
  | "operations"
  | "support"
  | "neutral";

type CityPoint = {
  name: string;
  region: string;
  x: number;
  y: number;
};

type SceneConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  cities: CityPoint[];
  metrics: Array<{ label: string; value: string }>;
  status: string[];
};

export type WorldRegion = "africa" | "europe" | "asia" | "americas" | "middleEast" | "global";

const globalCities: CityPoint[] = [
  { name: "Paris", region: "Europe", x: 27, y: 25 },
  { name: "Dakar", region: "Afrique", x: 38, y: 57 },
  { name: "Abidjan", region: "Afrique", x: 48, y: 68 },
  { name: "Lagos", region: "Afrique", x: 56, y: 65 },
  { name: "Dubai", region: "Asie", x: 72, y: 42 },
  { name: "Montreal", region: "Ameriques", x: 15, y: 36 },
];

const scenes: Record<JourneyScene, SceneConfig> = {
  home: {
    eyebrow: "Réseau mondial",
    title: "Un voyage, une route utile",
    description: "Colis, voyageurs, relais et hubs réunis dans une même expérience.",
    icon: Globe2,
    cities: globalCities,
    metrics: [
      { label: "Routes actives", value: "48" },
      { label: "Zones suivies", value: "12" },
      { label: "Confiance", value: "Vérifiée" },
    ],
    status: ["Mise en relation", "Dépôt", "Suivi", "Remise"],
  },
  client: {
    eyebrow: "Client",
    title: "Carte colis intelligente",
    description: "Expéditions, points relais et preuves réunis au même endroit.",
    icon: PackageCheck,
    cities: [
      { name: "Paris", region: "Départ", x: 24, y: 28 },
      { name: "Bruxelles", region: "Relais", x: 37, y: 38 },
      { name: "Dakar", region: "Arrivée", x: 62, y: 67 },
      { name: "Abidjan", region: "Option", x: 74, y: 58 },
    ],
    metrics: [
      { label: "Envois", value: "Suivi" },
      { label: "Retrait", value: "QR" },
      { label: "Assurance", value: "Active" },
    ],
    status: ["Demande créée", "Relais choisi", "Colis suivi", "Preuve archivée"],
  },
  transporter: {
    eyebrow: "Livreur",
    title: "Missions locales en mouvement",
    description: "Collecte, itinéraire, distance et remise finale avec contrôles terrain.",
    icon: Truck,
    cities: [
      { name: "Relais nord", region: "Pickup", x: 18, y: 42 },
      { name: "Client", region: "Collecte", x: 38, y: 25 },
      { name: "Hub", region: "Dépôt", x: 61, y: 57 },
      { name: "Destination", region: "Final", x: 81, y: 38 },
    ],
    metrics: [
      { label: "Distance", value: "7.8 km" },
      { label: "Missions", value: "4" },
      { label: "SLA", value: "96%" },
    ],
    status: ["Mission acceptée", "Navigation", "Scan du dépôt", "Livraison confirmée"],
  },
  traveler: {
    eyebrow: "Voyageur",
    title: "Capacité aérienne disponible",
    description: "Vols, billets, bagages et lots internationaux synchronisés.",
    icon: Plane,
    cities: [
      { name: "Paris CDG", region: "Départ", x: 20, y: 31 },
      { name: "Madrid", region: "Transit", x: 39, y: 48 },
      { name: "Casablanca", region: "Contrôle", x: 56, y: 58 },
      { name: "Dakar", region: "Arrivée", x: 78, y: 42 },
    ],
    metrics: [
      { label: "Capacité", value: "8 kg" },
      { label: "Billet", value: "Vérifié" },
      { label: "Lots", value: "3" },
    ],
    status: ["Billet ajouté", "Capacité déclarée", "Lot scellé", "QR de retrait"],
  },
  hub: {
    eyebrow: "Hub",
    title: "Entrepot de consolidation",
    description: "Batches, convoyeurs, inventaire et controles de sortie.",
    icon: Warehouse,
    cities: [
      { name: "Reception", region: "Inbound", x: 16, y: 56 },
      { name: "Tri", region: "Controle", x: 39, y: 34 },
      { name: "Batch", region: "Scelle", x: 61, y: 48 },
      { name: "Handover", region: "Sortie", x: 84, y: 28 },
    ],
    metrics: [
      { label: "Batches", value: "9" },
      { label: "Inventaire", value: "Live" },
      { label: "Ecarts", value: "0" },
    ],
    status: ["Reception", "Inspection", "Consolidation", "Remise voyageur"],
  },
  relay: {
    eyebrow: "Relais",
    title: "Comptoir colis et QR",
    description: "Depot client, scans rapides, stock local et sortie collecte.",
    icon: Store,
    cities: [
      { name: "Boutique", region: "Accueil", x: 22, y: 42 },
      { name: "Scan", region: "QR", x: 43, y: 58 },
      { name: "Stock", region: "Reserve", x: 65, y: 35 },
      { name: "Collecte", region: "Sortie", x: 82, y: 53 },
    ],
    metrics: [
      { label: "Scans", value: "Live" },
      { label: "Stock", value: "32" },
      { label: "Retards", value: "0" },
    ],
    status: ["Depot accepte", "QR controle", "Stock reserve", "Collecte planifiee"],
  },
  admin: {
    eyebrow: "Admin",
    title: "Centre de controle",
    description: "Indicateurs, alertes, paiements et supervision operationnelle.",
    icon: ShieldCheck,
    cities: [
      { name: "KPI", region: "Temps reel", x: 17, y: 31 },
      { name: "Paiements", region: "Controle", x: 38, y: 55 },
      { name: "Support", region: "Alertes", x: 61, y: 36 },
      { name: "Audit", region: "Controle", x: 82, y: 59 },
    ],
    metrics: [
      { label: "Accès", value: "Protégé" },
      { label: "Audit", value: "111" },
      { label: "Alertes", value: "OK" },
    ],
    status: ["Acces protege", "Journal", "Paiements", "Incidents"],
  },
  operations: {
    eyebrow: "Operations",
    title: "Tour de controle logistique",
    description: "Collecte, hub, relais, support et administration coordonnes.",
    icon: RadioTower,
    cities: [
      { name: "Collecte", region: "Terrain", x: 18, y: 60 },
      { name: "Relais", region: "Depot", x: 39, y: 36 },
      { name: "Hub", region: "Tri", x: 62, y: 56 },
      { name: "Support", region: "Alerte", x: 82, y: 31 },
    ],
    metrics: [
      { label: "Modules", value: "5" },
      { label: "Flux", value: "Live" },
      { label: "SLA", value: "99%" },
    ],
    status: ["Planification", "Collecte", "Hub", "Support"],
  },
  support: {
    eyebrow: "Support",
    title: "Assistance et litiges",
    description: "Tickets, preuves, messages et resolution claire pour chaque dossier.",
    icon: CheckCircle2,
    cities: [
      { name: "Client", region: "Ticket", x: 18, y: 38 },
      { name: "Support", region: "Analyse", x: 42, y: 58 },
      { name: "Ops", region: "Action", x: 63, y: 35 },
      { name: "Resolution", region: "Cloture", x: 84, y: 52 },
    ],
    metrics: [
      { label: "Tickets", value: "12" },
      { label: "Preuves", value: "OK" },
      { label: "Delai", value: "2h" },
    ],
    status: ["Ticket recu", "Preuve lue", "Action ops", "Client informe"],
  },
  neutral: {
    eyebrow: "Yobalelma",
    title: "Infrastructure de confiance",
    description: "Un socle sobre pour chaque parcours de livraison collaborative.",
    icon: Compass,
    cities: globalCities.slice(0, 4),
    metrics: [
      { label: "Flux", value: "Clair" },
      { label: "Rôle", value: "Protégé" },
      { label: "Suivi", value: "Actif" },
    ],
    status: ["Profil", "Action", "Contrôle", "Suivi"],
  },
};

const destinationModes = [
  {
    region: "Afrique",
    cities: ["Dakar", "Abidjan", "Nairobi", "Kigali", "Casablanca", "Lagos", "Le Cap"],
    color: "bg-emerald",
  },
  {
    region: "Europe",
    cities: ["Paris", "Londres", "Bruxelles", "Madrid"],
    color: "bg-ocean",
  },
  {
    region: "Asie",
    cities: ["Tokyo", "Seoul", "Singapore", "Dubai"],
    color: "bg-primary",
  },
  {
    region: "Ameriques",
    cities: ["New York", "Montreal", "Sao Paulo"],
    color: "bg-earth",
  },
];

const regionKeywords: Record<WorldRegion, string[]> = {
  africa: ["dakar", "senegal", "abidjan", "cote d'ivoire", "côte d'ivoire", "lagos", "casablanca", "maroc", "kigali", "nairobi"],
  americas: ["montreal", "montréal", "canada", "new york", "etats-unis", "états-unis", "sao paulo", "brasil"],
  asia: ["tokyo", "japon", "seoul", "singapore", "singapour", "chine", "shanghai"],
  europe: ["paris", "france", "madrid", "espagne", "londres", "bruxelles", "allemagne", "rome", "lisbonne"],
  global: [],
  middleEast: ["dubai", "dubaï", "emirats", "émirats", "abu dhabi"],
};

export function resolveWorldRegion(value?: string | null): WorldRegion {
  const input = value?.toLowerCase() ?? "";
  const found = (Object.entries(regionKeywords) as Array<[WorldRegion, string[]]>).find(([, keywords]) =>
    keywords.some((keyword) => input.includes(keyword)),
  );

  return found?.[0] ?? "global";
}

export function routeSceneFromPlaces({
  destination,
  origin,
}: {
  destination?: string | null;
  origin?: string | null;
}): JourneyScene {
  const regions = [resolveWorldRegion(origin), resolveWorldRegion(destination)];

  if (regions.includes("asia") || regions.includes("middleEast")) return "traveler";
  if (regions.includes("africa") && regions.includes("europe")) return "home";
  if (regions.includes("americas")) return "traveler";
  if (regions.includes("africa")) return "client";

  return "neutral";
}

export function resolveJourneyScene(input?: string): JourneyScene {
  const value = input?.toLowerCase() ?? "";

  if (value.includes("client") || value.includes("expedition")) return "client";
  if (value.includes("livreur") || value.includes("transport")) return "transporter";
  if (value.includes("voyageur") || value.includes("voyage")) return "traveler";
  if (value.includes("hub") || value.includes("batch")) return "hub";
  if (value.includes("relais")) return "relay";
  if (value.includes("admin") || value.includes("back-office")) return "admin";
  if (value.includes("operation") || value.includes("pilotage")) return "operations";
  if (value.includes("support") || value.includes("litige")) return "support";

  return "neutral";
}

export function SceneBackdrop({
  scene = "home",
  className,
  muted = false,
}: {
  scene?: JourneyScene;
  className?: string;
  muted?: boolean;
}) {
  const config = scenes[scene];

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div
        className={cn(
          "absolute inset-0",
          muted
            ? "bg-[linear-gradient(135deg,rgba(255,102,0,0.12),rgba(255,255,255,0.9)_38%,rgba(235,215,178,0.62)),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,244,236,0.86))]"
            : "bg-[linear-gradient(135deg,rgba(255,102,0,0.28),rgba(12,14,16,0.98)_34%,rgba(22,113,167,0.2)_72%,rgba(28,23,19,0.96)),linear-gradient(180deg,rgba(12,14,16,0.96),rgba(28,23,19,0.98))]",
        )}
      />
      <div className={cn("absolute inset-0 yb-map-grid", muted ? "opacity-40" : "opacity-20")} />
      <div className={cn("absolute inset-x-0 bottom-0 h-28 yb-skyline", muted ? "opacity-40" : "opacity-20")} />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.36))]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {config.cities.slice(0, -1).map((city, index) => {
          const next = config.cities[index + 1];
          const controlX = (city.x + next.x) / 2;
          const controlY = Math.min(city.y, next.y) - 14 - index * 2;

          return (
            <path
              key={`${city.name}-${next.name}`}
              d={`M ${city.x} ${city.y} Q ${controlX} ${controlY} ${next.x} ${next.y}`}
              fill="none"
              stroke={muted ? "rgba(255,102,0,0.36)" : "rgba(255,255,255,0.48)"}
              strokeWidth="0.42"
              strokeDasharray="7 9"
              className="yb-route-line"
              style={{ animationDelay: `${index * 420}ms` }}
            />
          );
        })}
      </svg>
      {config.cities.map((city, index) => (
        <span
          key={city.name}
          className={cn(
            "absolute h-2.5 w-2.5 rounded-full border",
            index === 0 ? "yb-signal-pulse bg-primary" : "bg-white",
            muted ? "border-black/20" : "border-white/60",
          )}
          style={{ left: `${city.x}%`, top: `${city.y}%` }}
        />
      ))}
    </div>
  );
}

export function JourneyVisualStage({
  scene = "home",
  className,
  frame = true,
}: {
  scene?: JourneyScene;
  className?: string;
  frame?: boolean;
}) {
  const config = scenes[scene];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative min-h-[310px] overflow-hidden text-white",
        frame ? "rounded-lg border border-white/20 bg-secondary shadow-panel" : "",
        className,
      )}
    >
      <SceneBackdrop scene={scene} />
      <div className="relative flex min-h-[310px] flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">{config.eyebrow}</p>
            <h3 className="mt-2 max-w-sm text-2xl font-black leading-tight">{config.title}</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">{config.description}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/10">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_160px] sm:items-end">
          <div className="relative min-h-32">
            {config.cities.map((city, index) => (
              <CityLabel key={city.name} city={city} hot={index === 0} />
            ))}
          </div>
          <div className="grid gap-2">
            {config.metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between gap-3 border-t border-white/20 py-2"
              >
                <span className="text-xs font-semibold text-white/60">{metric.label}</span>
                <span className="text-sm font-black text-white">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignalTimeline({
  scene = "neutral",
  items,
  className,
}: {
  scene?: JourneyScene;
  items?: string[];
  className?: string;
}) {
  const config = scenes[scene];
  const timeline = items?.length ? items : config.status;

  return (
    <div className={cn("grid gap-3", className)}>
      {timeline.map((item, index) => (
        <div key={item} className="grid grid-cols-[28px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-black",
                index === 0
                  ? "border-primary bg-primary text-white"
                  : "border-black/10 bg-white text-black/60",
              )}
            >
              {index + 1}
            </span>
            {index < timeline.length - 1 ? <span className="mt-2 h-full min-h-5 w-px bg-black/10" /> : null}
          </div>
          <div className="rounded-md border border-black/10 bg-white/80 p-3 shadow-line">
            <p className="text-sm font-bold text-black">{item}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-black/65">Étape suivie</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DestinationModeGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {destinationModes.map((mode) => (
        <article
          key={mode.region}
          className="group relative min-h-48 overflow-hidden rounded-lg border border-black/10 bg-white p-5 shadow-line transition hover:-translate-y-1 hover:shadow-panel"
        >
          <div className={cn("h-2 w-12 rounded-full", mode.color)} />
          <h3 className="mt-5 text-xl font-black">{mode.region}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {mode.cities.map((city) => (
              <span
                key={city}
                className="rounded-md border border-black/10 bg-muted px-2.5 py-1 text-xs font-bold text-black/70"
              >
                {city}
              </span>
            ))}
          </div>
          <CircleDot
            className="absolute bottom-4 right-4 h-8 w-8 text-primary/30 transition group-hover:text-primary"
            aria-hidden="true"
          />
        </article>
      ))}
    </div>
  );
}

export function SceneMetricRail({
  scene = "home",
  className,
}: {
  scene?: JourneyScene;
  className?: string;
}) {
  const config = scenes[scene];

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {config.metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-lg border border-white/20 bg-white/10 p-4 text-white backdrop-blur"
        >
          <p className="text-xs font-bold uppercase text-white/60">{metric.label}</p>
          <p className="mt-2 text-2xl font-black">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

export function sceneSummary(scene: JourneyScene) {
  return scenes[scene];
}

function CityLabel({ city, hot }: { city: CityPoint; hot?: boolean }) {
  const style = {
    "--city-x": `${city.x}%`,
    "--city-y": `${city.y}%`,
  } as CSSProperties;

  return (
    <span
      className="absolute flex max-w-32 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs font-bold text-white/80 backdrop-blur"
      style={{ left: "var(--city-x)", top: "var(--city-y)", ...style }}
    >
      {hot ? (
        <ScanLine className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      ) : (
        <MapPin className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
      )}
      <span className="truncate">{city.name}</span>
    </span>
  );
}

export const roleWorldCards = [
  {
    scene: "client" as const,
    title: "Client",
    text: "Carte de route, suivi et preuves lisibles en un coup d'oeil.",
    icon: PackageCheck,
  },
  {
    scene: "transporter" as const,
    title: "Livreur",
    text: "Missions locales, distance et scans operationnels.",
    icon: Truck,
  },
  {
    scene: "traveler" as const,
    title: "Voyageur",
    text: "Vols, billets, capacite bagage et lots internationaux.",
    icon: Plane,
  },
  {
    scene: "hub" as const,
    title: "Hub",
    text: "Consolidation, batches, inventaire et controles de sortie.",
    icon: Warehouse,
  },
  {
    scene: "relay" as const,
    title: "Relais",
    text: "Depot de proximite, QR, stock local et collecte.",
    icon: Store,
  },
  {
    scene: "admin" as const,
    title: "Admin",
    text: "Indicateurs, alertes, paiements et supervision temps reel.",
    icon: Building2,
  },
];
