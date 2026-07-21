import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PremiumChecklist, PremiumStory } from "@/components/design-system/premium";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export function UserAppInfoPage({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <PageShell eyebrow={eyebrow} title={title} description={description} scene="client">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <PremiumStory
          tone="client"
          eyebrow={eyebrow}
          title={title}
          description={description}
          icon={ShieldCheck}
        >
          <PremiumChecklist tone="client" items={bullets} />
        </PremiumStory>
        <aside className="rounded-lg bg-secondary p-6 text-white shadow-panel">
          <h2 className="text-2xl font-black">Continuer avec Yobalelma</h2>
          <p className="mt-3 text-sm leading-6 text-white/85">
            Crée un compte, prépare une expédition ou suis un colis depuis ton espace Yobalelma.
          </p>
          <div className="mt-5 grid gap-3">
            <Button asChild variant="secondary">
              <Link href="/client/shipments/new">Envoyer un colis <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tracking">Suivre un colis</Link>
            </Button>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
