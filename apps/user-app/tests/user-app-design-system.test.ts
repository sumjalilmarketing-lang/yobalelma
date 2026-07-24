import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd().endsWith("user-app")
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

function source(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("User App readable design foundations", () => {
  it("uses high-contrast semantic colours for interactive and status content", () => {
    const css = source("packages/ui/src/yobalelma.css");

    expect(css).toContain("--primary: var(--yb-orange-700)");
    expect(css).toContain("--yb-graphite-500: 215 10% 36%");
    expect(css).toContain("--info: 205 78% 31%");
  });

  it("protects hero copy from decorative artwork", () => {
    const pageShell = source("components/layout/page-shell.tsx");

    expect(pageShell).toContain("from-black/90 via-black/65 to-black/20");
    expect(pageShell).toContain("relative z-10");
    expect(pageShell).toContain("text-white/90");
  });

  it("adapts the header to authenticated sessions", () => {
    const header = source("components/layout/site-header.tsx");

    expect(header).toContain("isAuthenticated");
    expect(header).toContain("Mon espace");
    expect(header).toContain("Se déconnecter");
  });

  it("keeps authentication copy professional and user-facing", () => {
    const signIn = source("app/auth/sign-in/page.tsx");

    expect(signIn).toContain("Connexion sécurisée");
    expect(signIn).toContain("Tes informations restent confidentielles");
    expect(signIn).not.toContain("role et permissions");
    expect(signIn).not.toContain("projet Yobalelma uniquement");
  });
});
