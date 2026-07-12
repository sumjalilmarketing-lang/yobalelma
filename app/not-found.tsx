import Link from "next/link";
import { YobalelmaLogo } from "@/components/brand/yobalelma-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-6 text-center text-white">
      <YobalelmaLogo className="text-white" />
      <div>
        <p className="text-sm font-semibold uppercase text-primary">
          Page introuvable
        </p>
        <h1 className="mt-3 text-4xl font-black">Retour a Yobalelma</h1>
      </div>
      <Button asChild>
        <Link href="/">Accueil</Link>
      </Button>
    </main>
  );
}
