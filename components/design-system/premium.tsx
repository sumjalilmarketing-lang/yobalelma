import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Compass,
  Layers3,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PremiumTone =
  | "client"
  | "transporter"
  | "traveler"
  | "hub"
  | "relay"
  | "support"
  | "admin"
  | "operations"
  | "neutral";

const toneStyles: Record<
  PremiumTone,
  {
    accent: string;
    badge: string;
    canvas: string;
    icon: string;
    name: string;
  }
> = {
  client: {
    accent: "from-primary/18 via-sand/30 to-white",
    badge: "border-primary/25 bg-primary/10 text-primary",
    canvas: "yb-soft-canvas",
    icon: "bg-primary text-white",
    name: "Client",
  },
  transporter: {
    accent: "from-ocean/18 via-white to-primary/10",
    badge: "border-ocean/25 bg-ocean/10 text-ocean",
    canvas: "bg-[linear-gradient(135deg,rgba(22,113,167,0.12),rgba(255,255,255,0.94),rgba(255,102,0,0.1))]",
    icon: "bg-ocean text-white",
    name: "Livreur",
  },
  traveler: {
    accent: "from-sky/20 via-white to-primary/12",
    badge: "border-sky/30 bg-sky/10 text-ocean",
    canvas: "bg-[linear-gradient(135deg,rgba(78,166,216,0.18),rgba(255,255,255,0.95),rgba(255,102,0,0.12))]",
    icon: "bg-primary text-white",
    name: "Voyageur",
  },
  hub: {
    accent: "from-earth/18 via-white to-sand/36",
    badge: "border-earth/25 bg-earth/10 text-earth",
    canvas: "bg-[linear-gradient(135deg,rgba(110,75,43,0.13),rgba(255,255,255,0.95),rgba(235,215,178,0.36))]",
    icon: "bg-earth text-white",
    name: "Hub",
  },
  relay: {
    accent: "from-emerald/16 via-white to-sand/28",
    badge: "border-emerald/25 bg-emerald/10 text-emerald",
    canvas: "bg-[linear-gradient(135deg,rgba(31,122,85,0.13),rgba(255,255,255,0.96),rgba(235,215,178,0.26))]",
    icon: "bg-emerald text-white",
    name: "Relais",
  },
  support: {
    accent: "from-ocean/14 via-white to-sand/24",
    badge: "border-ocean/25 bg-ocean/10 text-ocean",
    canvas: "bg-[linear-gradient(135deg,rgba(22,113,167,0.12),rgba(255,255,255,0.96),rgba(235,215,178,0.24))]",
    icon: "bg-ocean text-white",
    name: "Support",
  },
  admin: {
    accent: "from-black/10 via-white to-primary/10",
    badge: "border-black/15 bg-black/5 text-black",
    canvas: "bg-[linear-gradient(135deg,rgba(12,14,16,0.08),rgba(255,255,255,0.96),rgba(255,102,0,0.1))]",
    icon: "bg-black text-primary",
    name: "Admin",
  },
  operations: {
    accent: "from-primary/16 via-white to-ocean/14",
    badge: "border-primary/25 bg-primary/10 text-primary",
    canvas: "bg-[linear-gradient(135deg,rgba(255,102,0,0.12),rgba(255,255,255,0.96),rgba(22,113,167,0.12))]",
    icon: "bg-secondary text-primary",
    name: "Operations",
  },
  neutral: {
    accent: "from-sand/30 via-white to-sky/10",
    badge: "border-black/10 bg-white text-black/70",
    canvas: "yb-soft-canvas",
    icon: "bg-secondary text-primary",
    name: "Yobalelma",
  },
};

export function toneFromLabel(label?: string): PremiumTone {
  const value = label?.toLowerCase() ?? "";

  if (value.includes("client") || value.includes("expediteur")) return "client";
  if (value.includes("livreur") || value.includes("transport")) return "transporter";
  if (value.includes("voyage")) return "traveler";
  if (value.includes("hub")) return "hub";
  if (value.includes("relais")) return "relay";
  if (value.includes("support") || value.includes("litige")) return "support";
  if (value.includes("admin")) return "admin";
  if (value.includes("collecte") || value.includes("operation") || value.includes("pilotage")) {
    return "operations";
  }

  return "neutral";
}

export function PremiumPanel({
  children,
  className,
  tone = "neutral",
  withPattern = true,
}: {
  children: ReactNode;
  className?: string;
  tone?: PremiumTone;
  withPattern?: boolean;
}) {
  return (
    <section
      className={cn(
        "yb-panel relative overflow-hidden",
        toneStyles[tone].canvas,
        className,
      )}
    >
      {withPattern ? (
        <>
          <div className="absolute inset-0 yb-modern-kente opacity-[0.12]" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-20 yb-skyline opacity-25" aria-hidden />
        </>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}

export function PremiumBadge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: PremiumTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[.08em]",
        toneStyles[tone].badge,
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

export function PremiumKpi({
  description,
  icon: Icon = CircleDot,
  label,
  tone = "neutral",
  value,
}: {
  description?: string;
  icon?: LucideIcon;
  label: string;
  tone?: PremiumTone;
  value: ReactNode;
}) {
  return (
    <article className="yb-kpi yb-card-reveal transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-black/65">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none text-black">{value}</p>
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", toneStyles[tone].icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {description ? <p className="mt-4 text-sm font-medium leading-6 text-black/75">{description}</p> : null}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full w-2/3 rounded-full bg-gradient-to-r", toneStyles[tone].accent)} />
      </div>
    </article>
  );
}

export function PremiumActionCard({
  description,
  href,
  icon: Icon = ArrowRight,
  label,
  tone = "neutral",
}: {
  description: string;
  href: string;
  icon?: LucideIcon;
  label: string;
  tone?: PremiumTone;
}) {
  return (
    <Link
      href={href}
      className="group yb-card yb-card-reveal flex min-h-44 flex-col justify-between p-5 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-panel"
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-md", toneStyles[tone].icon)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xl font-black text-black">{label}</span>
        <span className="mt-2 block text-sm leading-6 text-black/75">{description}</span>
      </span>
      <span className="inline-flex items-center gap-2 text-sm font-black text-primary">
        Ouvrir
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function PremiumStory({
  children,
  description,
  eyebrow,
  icon: Icon = Compass,
  title,
  tone = "neutral",
}: {
  children?: ReactNode;
  description: string;
  eyebrow: string;
  icon?: LucideIcon;
  title: string;
  tone?: PremiumTone;
}) {
  return (
    <PremiumPanel tone={tone} className="p-6">
      <div className="flex items-start gap-4">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-md", toneStyles[tone].icon)}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <PremiumBadge tone={tone}>{eyebrow}</PremiumBadge>
          <h2 className="mt-4 text-2xl font-black leading-tight text-black md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-black/75">{description}</p>
        </div>
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </PremiumPanel>
  );
}

export function PremiumEmptyState({
  action,
  description,
  tone = "neutral",
  title,
}: {
  action?: { href: string; label: string };
  description: string;
  tone?: PremiumTone;
  title: string;
}) {
  return (
    <PremiumPanel tone={tone} className="p-6">
      <div className="grid gap-6 md:grid-cols-[1fr_180px] md:items-center">
        <div>
          <PremiumBadge tone={tone}>Etat vide</PremiumBadge>
          <h2 className="mt-4 text-2xl font-black text-black">{title}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-black/75">{description}</p>
          {action ? (
            <Link
              href={action.href}
              className="yb-button yb-button-primary mt-5"
            >
              {action.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <div className="relative hidden h-40 overflow-hidden rounded-lg border border-black/10 bg-white/70 md:block">
          <div className="absolute inset-0 yb-modern-kente opacity-[0.14]" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-20 yb-skyline opacity-30" aria-hidden />
          <div className="absolute left-8 top-8 flex h-14 w-14 items-center justify-center rounded-md bg-secondary text-primary shadow-panel">
            <Layers3 className="h-7 w-7" aria-hidden="true" />
          </div>
          <MapPinned className="absolute bottom-7 right-8 h-10 w-10 text-primary" aria-hidden="true" />
        </div>
      </div>
    </PremiumPanel>
  );
}

export function PremiumChecklist({
  items,
  tone = "neutral",
}: {
  items: string[];
  tone?: PremiumTone;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3 rounded-md border border-black/10 bg-white/80 p-3 shadow-line">
          <CheckCircle2 className={cn("mt-0.5 h-5 w-5 shrink-0", tone === "neutral" ? "text-primary" : "text-primary")} aria-hidden="true" />
          <p className="text-sm font-semibold leading-6 text-black/80">{item}</p>
        </div>
      ))}
    </div>
  );
}

export function premiumToneName(tone: PremiumTone) {
  return toneStyles[tone].name;
}
