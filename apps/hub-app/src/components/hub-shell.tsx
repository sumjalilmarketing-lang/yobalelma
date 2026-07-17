"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { LocalizationSwitcher } from "@/components/i18n/localization-switcher";
import { cn } from "@/lib/utils";
import { canAccessHubNavigation, hubNavigation } from "../lib/permissions";
import type { HubSession } from "../lib/types";
import { HubLogo } from "./hub-logo";

export function HubShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: HubSession;
}) {
  const pathname = usePathname();
  const visibleNavigation = hubNavigation.filter((item) => canAccessHubNavigation(session.role, item));

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4">
          <HubLogo />
          <Link href="/hub/search" className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-black/10 bg-muted/50 px-3 py-2 lg:flex">
            <Search className="h-4 w-4 text-primary" />
            <span className="truncate text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              Recherche tracking, manifeste, vol, lot ou anomalie
            </span>
            <kbd className="ml-auto rounded border bg-white px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
          </Link>
          <LocalizationSwitcher className="hidden lg:flex" />
          <Link
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-black/10 bg-white text-primary shadow-line"
            href="/hub/notifications"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <form action="/api/auth/hub-sign-out" method="post">
            <button
              aria-label="Deconnexion"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white shadow-line"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 pb-8 pt-20 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <div className="hub-pattern rounded-lg border border-black/10 bg-white p-3 shadow-line">
            <div className="rounded-lg bg-black p-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Session Hub</p>
              <p className="mt-2 truncate text-lg font-black">{session.name}</p>
              <p className="truncate text-xs font-bold text-white/65">{session.role}</p>
            </div>
            <nav className="mt-3 grid gap-1" aria-label="Navigation Hub">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-black transition hover:bg-primary hover:text-white",
                    pathname === item.href || (item.href !== "/hub" && pathname.startsWith(item.href))
                      ? "bg-black text-white"
                      : "text-muted-foreground",
                  )}
                  href={item.href}
                >
                  {navigationLabel(item.labelKey)}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function navigationLabel(key: string) {
  const labels: Record<string, string> = {
    anomalies: "Anomalies",
    alerts: "Alertes",
    agents: "Performance agents",
    audit: "Audit",
    batches: "Lots",
    capacities: "Capacites",
    dashboard: "Centre Hub",
    controlTower: "Control Tower",
    documents: "Documents",
    exports: "Exports",
    forecast: "Prévisions",
    handover: "Remise",
    history: "Historique",
    inbound: "Reception",
    inspection: "Inspection",
    incidents: "Incidents",
    inventory: "Inventaire",
    notifications: "Notifications",
    profile: "Profil",
    reports: "Rapports",
    scanner: "Scanner",
    search: "Recherche globale",
    settings: "Parametres",
    storage: "Stockage",
    stockMonitoring: "Supervision stock",
    systemHealth: "Santé système",
    trips: "Voyages",
  };

  return labels[key] ?? key;
}
