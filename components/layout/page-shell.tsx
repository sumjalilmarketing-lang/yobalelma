import type { ReactNode } from "react";
import { MapPinned, Plane } from "lucide-react";
import { PremiumBadge, toneFromLabel } from "@/components/design-system/premium";
import { SiteHeader } from "@/components/layout/site-header";
import {
  SceneBackdrop,
  type JourneyScene,
  resolveJourneyScene,
  sceneSummary,
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
  const summary = sceneSummary(resolvedScene);
  const start = summary.cities[0];
  const end = summary.cities.at(-1) ?? start;

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
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-white/20 bg-white/10 shadow-line backdrop-blur lg:block">
            <div className="relative h-72">
              <SceneBackdrop scene={resolvedScene} className="opacity-95" />
              <div className="absolute inset-0 yb-modern-kente opacity-20" aria-hidden />
              <div className="relative flex h-full flex-col justify-between p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-black/35 text-primary">
                    <MapPinned className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-black/35 text-primary">
                    <Plane className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="grid gap-4 rounded-lg border border-white/20 bg-black/35 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm font-black text-white">
                    <span className="truncate">{start.name}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-primary via-white/50 to-primary" />
                    <span className="truncate">{end.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {summary.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-md border border-white/15 bg-white/10 p-3">
                        <p className="text-[10px] font-black uppercase text-white/50">{metric.label}</p>
                        <p className="mt-1 text-sm font-black text-white">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container yb-page-enter py-10 md:py-14">{children}</section>
    </main>
  );
}
