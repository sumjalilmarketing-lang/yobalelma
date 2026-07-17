import type { SupportedLocale } from "@/lib/i18n/config";
import type { HubMessageKey } from "./types";

type HubDictionary = Record<HubMessageKey | "hubTitle" | "hubSubtitle" | "signIn" | "signOut", string>;

const fr: HubDictionary = {
  anomalies: "Anomalies",
  alerts: "Alertes", agents: "Performance agents", audit: "Audit", controlTower: "Control Tower", documents: "Documents", exports: "Exports", forecast: "Prévisions", incidents: "Incidents", search: "Recherche", stockMonitoring: "Supervision stock", systemHealth: "Santé système",
  batches: "Lots",
  capacities: "Capacites",
  dashboard: "Centre Hub",
  handover: "Remise voyageur",
  history: "Historique",
  hubSubtitle: "Pilotage logistique, inspection, capacite et remise internationale.",
  hubTitle: "Yobalelma Hub",
  inbound: "Reception",
  inspection: "Inspection",
  inventory: "Inventaire",
  notifications: "Notifications",
  profile: "Profil",
  reports: "Rapports",
  scanner: "Scanner",
  settings: "Parametres",
  signIn: "Connexion Hub",
  signOut: "Deconnexion",
  storage: "Stockage",
  trips: "Voyages",
};

const en: HubDictionary = {
  anomalies: "Anomalies",
  alerts: "Alerts", agents: "Agent performance", audit: "Audit", controlTower: "Control Tower", documents: "Documents", exports: "Exports", forecast: "Forecast", incidents: "Incidents", search: "Search", stockMonitoring: "Stock monitoring", systemHealth: "System health",
  batches: "Batches",
  capacities: "Capacities",
  dashboard: "Hub Control",
  handover: "Traveler handover",
  history: "History",
  hubSubtitle: "Logistics control, inspection, capacity and international handover.",
  hubTitle: "Yobalelma Hub",
  inbound: "Inbound",
  inspection: "Inspection",
  inventory: "Inventory",
  notifications: "Notifications",
  profile: "Profile",
  reports: "Reports",
  scanner: "Scanner",
  settings: "Settings",
  signIn: "Hub sign in",
  signOut: "Sign out",
  storage: "Storage",
  trips: "Trips",
};

const es: HubDictionary = { ...en, dashboard: "Centro Hub", inbound: "Recepcion", signIn: "Acceso Hub" };
const pt: HubDictionary = { ...en, dashboard: "Centro Hub", inbound: "Recepcao", signIn: "Entrar no Hub" };
const de: HubDictionary = { ...en, dashboard: "Hub Kontrolle", inbound: "Eingang", signIn: "Hub Anmeldung" };
const it: HubDictionary = { ...en, dashboard: "Controllo Hub", inbound: "Ricezione", signIn: "Accesso Hub" };
const ar: HubDictionary = { ...en, dashboard: "مركز التشغيل", inbound: "الاستقبال", signIn: "دخول المركز" };
const ru: HubDictionary = { ...en, dashboard: "Центр хаба", inbound: "Прием", signIn: "Вход в хаб" };
const zh: HubDictionary = { ...en, dashboard: "枢纽中心", inbound: "入库", signIn: "枢纽登录" };

export const hubDictionaries: Record<SupportedLocale, HubDictionary> = {
  ar,
  de,
  en,
  es,
  fr,
  it,
  pt,
  ru,
  "zh-CN": zh,
};

export function hubText(locale: SupportedLocale, key: keyof HubDictionary) {
  return hubDictionaries[locale]?.[key] ?? hubDictionaries.fr[key];
}
