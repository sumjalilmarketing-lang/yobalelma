import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  JourneyVisualStage,
  SceneBackdrop,
  SignalTimeline,
  type JourneyScene,
  resolveJourneyScene,
  sceneSummary,
} from "@/components/visual/yobalelma-world";

type DashboardAction = {
  href: string;
  label: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "dark";
};

type RoleDashboardProps = {
  email: string;
  roleLabel: string;
  title: string;
  description: string;
  actions: DashboardAction[];
  checkpoints: string[];
  scene?: JourneyScene;
};

export function RoleDashboard({
  email,
  roleLabel,
  title,
  description,
  actions,
  checkpoints,
  scene,
}: RoleDashboardProps) {
  const resolvedScene = scene ?? resolveJourneyScene(`${roleLabel} ${title}`);
  const summary = sceneSummary(resolvedScene);

  return (
    <div className="grid gap-8">
      <section className="relative overflow-hidden rounded-lg border border-black/10 bg-secondary text-white shadow-panel">
        <SceneBackdrop scene={resolvedScene} />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_410px] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold uppercase text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {roleLabel}
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight md:text-4xl">{title}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/70">{description}</p>
            <p className="mt-5 text-sm font-bold text-white/70">{email}</p>
            <form action="/api/auth/sign-out" method="post" className="mt-6">
              <Button type="submit" variant="secondary">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Deconnexion
              </Button>
            </form>
          </div>
          <JourneyVisualStage scene={resolvedScene} frame={false} className="min-h-[270px]" />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.href}
            asChild
            size="lg"
            variant={action.variant ?? "default"}
            className="justify-between"
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm font-bold uppercase text-primary">Statut de preparation</p>
          <h3 className="mt-2 text-2xl font-black">Parcours operationnel</h3>
          <SignalTimeline scene={resolvedScene} items={checkpoints} className="mt-5" />
        </div>
        <div className="grid content-start gap-3">
          {summary.metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-black/10 bg-white p-5 shadow-line">
              <p className="text-sm font-bold text-black/50">{metric.label}</p>
              <p className="mt-2 text-3xl font-black">{metric.value}</p>
            </div>
          ))}
          <div className="rounded-lg border border-black/10 bg-accent p-5 shadow-line">
            <p className="text-sm font-bold uppercase text-black/60">{summary.eyebrow}</p>
            <p className="mt-2 text-lg font-black">{summary.title}</p>
            <p className="mt-2 text-sm leading-6 text-black/60">{summary.description}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
