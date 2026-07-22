import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { YobalelmaLogo } from "@/components/brand/yobalelma-logo";
import { Button } from "@/components/ui/button";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/envoyer", label: "Envoyer" },
  { href: "/suivi", label: "Suivi" },
  { href: "/livreur", label: "Livreur" },
  { href: "/voyager", label: "Voyager" },
  { href: "/dashboard", label: "Mes espaces" },
];

export async function SiteHeader() {
  const supabase = await tryCreateSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isAuthenticated = Boolean(data.user);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 shadow-line backdrop-blur-xl">
      <div className="container flex min-h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Accueil Yobalelma" className="shrink-0">
          <YobalelmaLogo variant="wordmark" className="w-[176px] sm:w-[210px] lg:w-[232px]" />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 rounded-md border border-black/10 bg-muted/70 p-1 text-sm font-bold text-black/80 md:flex">
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
        <div className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              <Button asChild size="sm" variant="secondary">
                <Link href="/dashboard">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Mon espace
                </Link>
              </Button>
              <form action="/api/auth/sign-out" method="post" className="hidden sm:block">
                <Button type="submit" size="sm" variant="ghost" aria-label="Se déconnecter">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Déconnexion</span>
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/sign-in">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Connexion
              </Link>
            </Button>
          )}
        </div>
      </div>
      <nav aria-label="Navigation mobile" className="container grid grid-cols-5 gap-1 pb-3 text-xs font-extrabold leading-tight text-black/80 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="grid min-h-11 place-items-center rounded-md border border-black/10 bg-muted/70 px-1 py-2 text-center transition hover:border-primary/50 hover:bg-white hover:text-black"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
