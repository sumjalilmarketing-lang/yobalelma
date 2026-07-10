import Link from "next/link";
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
    <header className="border-b border-black/10 bg-white">
      <div className="container flex min-h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Accueil Yobalelma">
          <YobalelmaLogo />
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-black/68 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link href="/auth/sign-in">Connexion</Link>
        </Button>
      </div>
    </header>
  );
}
