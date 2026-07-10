import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="min-h-screen bg-white text-black">
      <SiteHeader />
      <section className="border-b border-black/10 bg-black py-12 text-white md:py-16">
        <div className="container max-w-5xl">
          {eyebrow ? (
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">{description}</p>
        </div>
      </section>
      <section className="container py-10 md:py-14">{children}</section>
    </main>
  );
}
