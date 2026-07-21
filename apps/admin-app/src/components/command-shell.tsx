"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, BookOpenCheck, Building2, ClipboardList, LogOut, Menu, Moon, Search, ShieldCheck, Sun, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AdminSession } from "../lib/types";
import { getGovernanceRole, type GovernanceDirection } from "../lib/governance-catalog";

const primary = [
  { href: "/command", label: "Vue d’ensemble", icon: Activity },
  { href: "/command/missions", label: "Missions", icon: ClipboardList },
  { href: "/command/workflows", label: "Workflows", icon: BookOpenCheck },
  { href: "/command/equipes", label: "Équipes", icon: Users },
  { href: "/command/audit", label: "Journal des décisions", icon: ShieldCheck },
];

export function CommandShell({ children, directions, session }: { children: React.ReactNode; directions: GovernanceDirection[]; session: AdminSession }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const roleLabels = session.roleIds.map((roleId) => getGovernanceRole(roleId)?.label ?? roleId).join(" · ");
  useEffect(() => { const value = localStorage.getItem("yobalelma.command.theme") === "dark"; setDark(value); document.documentElement.classList.toggle("dark", value); setHydrated(true); }, []);
  const toggleTheme = () => setDark((current) => { const next = !current; localStorage.setItem("yobalelma.command.theme", next ? "dark" : "light"); document.documentElement.classList.toggle("dark", next); return next; });
  return <div className="yb-app-shell">
    <header className="yb-topbar fixed inset-x-0 top-0 z-50"><div className="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-3 md:px-5">
      <button disabled={!hydrated} className="grid h-10 w-10 place-items-center rounded-lg border disabled:opacity-50 lg:hidden" aria-label="Ouvrir la navigation" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
      <Link href="/command" className="flex items-center gap-2"><Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={40} height={40} priority /><span className="hidden sm:block"><strong className="block leading-none">Yobalelma</strong><small className="font-black uppercase tracking-[.15em] text-primary">Command</small></span></Link>
      <Link href="/command/missions" className="ml-auto hidden max-w-xl flex-1 items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 lg:flex"><Search className="h-4 w-4 text-primary" /><span className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Rechercher une mission ou une responsabilité</span></Link>
      <button aria-label="Changer de thème" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-lg border">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
      <Link aria-label="Notifications" href="/command/missions" className="grid h-10 w-10 place-items-center rounded-lg border"><Bell className="h-4 w-4" /></Link>
      <form action="/api/auth/sign-out" method="post"><button aria-label="Déconnexion" className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white"><LogOut className="h-4 w-4" /></button></form>
    </div></header>
    {open ? <div className="fixed inset-0 z-[70] bg-black/50 p-3 lg:hidden"><div className="h-full w-[min(88vw,340px)] overflow-y-auto rounded-xl bg-background p-3 shadow-panel"><div className="flex items-center justify-between px-2 py-1"><p className="text-xs font-black uppercase tracking-[.15em] text-primary">Navigation</p><button aria-label="Fermer la navigation" className="grid h-9 w-9 place-items-center rounded-lg border" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button></div><nav className="mt-3 grid gap-1" aria-label="Navigation mobile">{primary.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={navClass(pathname, href)} onClick={() => setOpen(false)}><Icon className="h-4 w-4" />{label}</Link>)}</nav><p className="mt-5 px-3 text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">Directions autorisées</p><nav className="mt-2 grid gap-1" aria-label="Directions">{directions.map((direction) => <Link key={direction.id} href={`/command/directions/${direction.slug}`} className={navClass(pathname, `/command/directions/${direction.slug}`)} onClick={() => setOpen(false)}><Building2 className="h-4 w-4" />{direction.shortLabel}</Link>)}</nav></div></div> : null}
    <div className="mx-auto grid max-w-[1800px] gap-5 px-3 pb-24 pt-20 md:px-5 lg:grid-cols-[300px_1fr] lg:pb-8">
      <aside className="hidden lg:block">
        <div className="yb-sidebar sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-3">
          <div className="rounded-xl bg-black p-4 text-white"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Responsabilité active</p><p className="mt-2 truncate text-lg font-black">{session.name}</p><p className="mt-1 truncate text-xs font-bold text-white/60">{session.email}</p></div>
          <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-black text-primary">{roleLabels}</p>
          <nav className="mt-4 grid gap-1" aria-label="Navigation du centre de commandement">{primary.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={navClass(pathname, href)} onClick={() => setOpen(false)}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
          <p className="mt-5 px-3 text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">Directions autorisées</p>
          <nav className="mt-2 grid gap-1" aria-label="Directions">{directions.map((direction) => <Link key={direction.id} href={`/command/directions/${direction.slug}`} className={navClass(pathname, `/command/directions/${direction.slug}`)} onClick={() => setOpen(false)}><Building2 className="h-4 w-4" />{direction.shortLabel}</Link>)}</nav>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}

function navClass(pathname: string, href: string) {
  const active = pathname === href || (href !== "/command" && pathname.startsWith(`${href}/`));
  return cn("yb-nav-item", active ? "bg-black text-white [box-shadow:inset_3px_0_hsl(var(--primary))]" : "text-muted-foreground");
}
