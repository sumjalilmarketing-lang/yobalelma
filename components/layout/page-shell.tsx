import type { ReactNode } from "react";
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="relative isolate overflow-hidden border-b border-black/10 bg-secondary py-12 text-white md:py-16">
        <SceneBackdrop scene={resolvedScene} className="opacity-80" />
        <div className="absolute inset-0 yb-pattern opacity-20" aria-hidden />
        <div className="container relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="max-w-5xl">
            {eyebrow ? (
              <p className="text-sm font-bold uppercase text-primary">{eyebrow}</p>
            ) : null}
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">{description}</p>
          </div>
          <div className="hidden rounded-lg border border-white/20 bg-white/10 p-4 shadow-line backdrop-blur lg:block">
            <p className="text-xs font-bold uppercase text-white/60">Yobalelma live layer</p>
            <p className="mt-2 text-2xl font-black">Route, role, preuve</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Une interface claire pour les colis, les trajets et les operations.
            </p>
          </div>
        </div>
      </section>
      <section className="container py-10 md:py-14">{children}</section>
    </main>
  );
}
