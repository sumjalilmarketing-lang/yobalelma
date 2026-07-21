"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CloudOff, LogOut, Menu, Moon, Navigation, Search, Sun, Wifi } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocalization } from "@/components/i18n/localization-provider";
import { cn } from "@/lib/utils";
import { canAccessCollectionNavigation, collectionNavigation } from "../lib/permissions";
import type { CollectionSession } from "../lib/types";

const groupLabels = { missions: "Missions & parcours", operations: "Opérations terrain", fleet: "Véhicule", account: "Compte & système" };
export function CollectionShell({ children, session }: { children: React.ReactNode; session: CollectionSession }) {
  const pathname = usePathname(); const { settings } = useLocalization(); const [online, setOnline] = useState(true); const [dark, setDark] = useState(false);
  useEffect(() => { const update = () => setOnline(navigator.onLine); update(); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  useEffect(() => { const stored = localStorage.getItem("yobalelma.collection.theme") === "dark"; setDark(stored); document.documentElement.classList.toggle("dark", stored); }, []);
  const navigation = useMemo(() => collectionNavigation.filter((item) => canAccessCollectionNavigation(session.role, item)), [session.role]);
  const toggleTheme = () => setDark((current) => { const next = !current; localStorage.setItem("yobalelma.collection.theme", next ? "dark" : "light"); document.documentElement.classList.toggle("dark", next); return next; });
  return <div className="yb-app-shell">
    <header className="yb-topbar fixed inset-x-0 top-0 z-50"><div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 md:px-5">
      <Link href="/collection" className="flex items-center gap-2"><Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={40} height={40} priority /><span className="hidden sm:block"><strong className="block leading-none">Yobalelma</strong><small className="font-black uppercase tracking-[.16em] text-primary">Collection</small></span></Link>
      <Link href="/collection/scanner" className="ml-auto hidden flex-1 items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 lg:flex"><Search className="h-4 w-4 text-primary" /><span className="text-xs font-black uppercase tracking-[.14em] text-muted-foreground">Rechercher mission, lot ou colis</span></Link>
      <div aria-label={online ? "Statut réseau : en ligne" : "Statut réseau : hors ligne"} className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black", online ? "bg-success/10 text-success" : "bg-warning/15 text-foreground")}>{online ? <Wifi className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}<span className="hidden md:inline">{online ? "En ligne" : "Hors ligne"}</span></div>
      <button aria-label="Changer de thème" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-lg border bg-background">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
      <Link aria-label="Notifications" href="/collection/notifications" className="relative grid h-10 w-10 place-items-center rounded-lg border bg-background"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" /></Link>
      <form action="/api/auth/collection-sign-out" method="post"><button aria-label="Déconnexion" className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white"><LogOut className="h-4 w-4" /></button></form>
    </div></header>
    <div className="mx-auto grid max-w-[1600px] gap-5 px-3 pb-24 pt-20 md:px-5 lg:grid-cols-[280px_1fr] lg:pb-8">
      <aside className="hidden lg:block"><div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border bg-background p-3 shadow-line"><div className="rounded-xl bg-black p-4 text-white"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Transport interne</p><p className="mt-2 truncate text-lg font-black">{session.name}</p><p className="mt-1 text-xs font-bold text-white/60">{session.role} · {settings.timeZone}</p></div><CollectionNavigation pathname={pathname} navigation={navigation} /></div></aside>
      <main className="min-w-0">{children}</main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t bg-background/95 px-2 py-2 backdrop-blur lg:hidden" aria-label="Navigation mobile">
      {[{ href: "/collection", label: "Accueil", icon: Menu },{ href: "/collection/missions", label: "Missions", icon: Navigation },{ href: "/collection/scanner", label: "Scanner", icon: Search },{ href: "/collection/map", label: "GPS", icon: Wifi },{ href: "/collection/profile", label: "Profil", icon: Bell }].map(({href,label,icon:Icon})=><Link className={cn("grid justify-items-center gap-1 rounded-lg p-1 text-[10px] font-black", pathname === href ? "text-primary" : "text-muted-foreground")} href={href} key={href}><Icon className="h-5 w-5" />{label}</Link>)}
    </nav>
  </div>;
}
function CollectionNavigation({ pathname, navigation }: { pathname: string; navigation: typeof collectionNavigation }) {
  return <nav className="mt-3 grid gap-3" aria-label="Navigation Collection">{(["missions","operations","fleet","account"] as const).map((group)=><div key={group}><p className="px-3 py-1 text-[10px] font-black uppercase tracking-[.15em] text-muted-foreground">{groupLabels[group]}</p><div className="grid gap-1">{navigation.filter((item)=>item.group===group).map((item)=><Link key={item.href} href={item.href} className={cn("rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-primary hover:text-white", pathname === item.href || (item.href !== "/collection" && pathname.startsWith(item.href)) ? "bg-black text-white" : "text-muted-foreground")}>{item.label}</Link>)}</div></div>)}</nav>;
}
