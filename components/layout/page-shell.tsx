import type { ReactNode } from "react";
import { Globe2, ShieldCheck, Sparkles } from "lucide-react";
import {
  PremiumBadge,
  PremiumChecklist,
  toneFromLabel,
} from "@/components/design-system/premium";
import { SiteHeader } from "@/components/layout/site-header";
import {
  SceneBackdrop,
  type JourneyScene,
  resolveJourneyScene,
} from "@/components/visual/yobalelma-world";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  scene?: JourneyScene;
};

export function PageShell({ eyebrow, title, description, children, scene }: PageShellProps) {
  const resolvedScene = scene ?? resolveJourneyScene(`${eyebrow ?? ""} ${title}`);
  const tone = toneFromLabel(`${eyebrow ?? ""} ${title}`);

  return (
    <main className="min-h-screen yb-soft-canvas text-foreground">
      <SiteHeader />
      <section className="relative isolate overflow-hidden border-b border-black/10 yb-premium-canvas py-12 text-white md:py-16">
        <SceneBackdrop scene={resolvedScene} className="opacity-80" />
        <div className="absolute inset-0 yb-modern-kente opacity-[0.16]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-28 yb-skyline opacity-30" aria-hidden />
        <div className="container relative grid gap-8 lg:grid-cols-[1fr_390px] lg:items-end">
          <div className="max-w-5xl">
            {eyebrow ? (
              <PremiumBadge tone={tone} className="border-white/20 bg-white/10 text-white">
                {eyebrow}
              </PremiumBadge>
            ) : null}
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">{description}</p>
            <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { label: "Identite controlee", icon: ShieldCheck },
                { label: "Route suivie", icon: Globe2 },
                { label: "Experience premium", icon: Sparkles },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/75 backdrop-blur"
                >
                  <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden rounded-lg border border-white/20 bg-white/10 p-4 shadow-line backdrop-blur lg:block">
            <p className="text-xs font-bold uppercase text-white/60">Yobalelma live layer</p>
            <p className="mt-2 text-2xl font-black">Route, role, preuve</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Une experience pensee pour inspirer confiance avant chaque action.
            </p>
            <PremiumChecklist
              tone={tone}
              items={["Signal visuel par role.", "Contexte de destination.", "Actions lisibles et securisees."]}
            />
          </div>
        </div>
      </section>
      <section className="container py-10 md:py-14">{children}</section>
    </main>
  );
}
