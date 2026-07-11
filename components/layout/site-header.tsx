import Link from "next/link";
import { LogIn } from "lucide-react";
import { YobalelmaLogo } from "@/components/brand/yobalelma-logo";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/envoyer", label: "Envoyer" },
  { href: "/livreur", label: "Livreur" },
  { href: "/voyager", label: "Voyager" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 shadow-line backdrop-blur-xl">
      <div className="container flex min-h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Accueil Yobalelma" className="shrink-0">
          <YobalelmaLogo />
        </Link>
        <nav className="hidden items-center gap-1 rounded-md border border-black/10 bg-muted/70 p-1 text-sm font-bold text-black/70 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 transition hover:bg-white hover:text-black hover:shadow-line"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link href="/auth/sign-in">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Connexion
          </Link>
        </Button>
      </div>
    </header>
  );
}
