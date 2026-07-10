import Link from "next/link";
import { Button } from "@/components/ui/button";

type DashboardAction = {
  href: string;
  label: string;
  variant?: "default" | "secondary";
};

type RoleDashboardProps = {
  email: string;
  roleLabel: string;
  title: string;
  description: string;
  actions: DashboardAction[];
  checkpoints: string[];
};

export function RoleDashboard({
  email,
  roleLabel,
  title,
  description,
  actions,
  checkpoints,
}: RoleDashboardProps) {
  return (
    <div className="grid gap-8">
      <section className="flex flex-col justify-between gap-5 rounded-lg bg-black p-6 text-white md:flex-row md:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            {roleLabel}
          </p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-white/70">{description}</p>
          <p className="mt-4 text-sm font-bold text-white/64">{email}</p>
        </div>
        <form action="/api/auth/sign-out" method="post">
          <Button type="submit" variant="secondary">
            Deconnexion
          </Button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <Button key={action.href} asChild size="lg" variant={action.variant ?? "default"}>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ))}
      </section>

      <section className="rounded-lg border border-black/10 p-6">
        <h3 className="text-xl font-black">Statut de preparation</h3>
        <div className="mt-5 grid gap-3">
          {checkpoints.map((checkpoint) => (
            <div
              key={checkpoint}
              className="flex items-start gap-3 rounded-md bg-muted p-3 text-sm font-semibold"
            >
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              <span>{checkpoint}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
