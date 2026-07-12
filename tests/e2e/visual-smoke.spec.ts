import { expect, type Locator, type Page, test } from "playwright/test";

const desktop = { width: 1440, height: 1000 };
const mobile = { width: 390, height: 900 };

const publicSurfaces = [
  {
    path: "/envoyer",
    heading: "Creer une expedition",
    text: ["Expediteur et enlevement", "Avant de confirmer", "Nom expediteur"],
  },
  {
    path: "/voyager",
    heading: "Publier un trajet disponible",
    text: ["Trajet fiable", "Ville de depart", "Publier mon voyage"],
  },
  {
    path: "/livreur",
    heading: "Creer ton profil voyageur-livreur",
    text: ["Nom complet", "Ce profil sert a quoi ?", "Profil transporteur local"],
  },
  {
    path: "/support",
    heading: "Contacter Yobalelma",
    text: ["Ticket support", "Compte requis", "Connexion"],
  },
  {
    path: "/auth/sign-in",
    heading: "Connexion securisee",
    text: ["Se connecter", "Creer un compte", "Ou recevoir un lien magique"],
  },
];

test("landing page keeps premium CTAs and responsive layout", async ({ page }) => {
  await page.setViewportSize(desktop);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Chaque voyage devient une livraison" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Envoyer un colis/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Devenir livreur/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Voyager avec Yobalelma/ }).first()).toBeVisible();
  await expectVisibleAfterScroll(page.getByText("Mode pays"));
  await expectVisibleAfterScroll(page.getByText("Espaces metiers"));
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize(mobile);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Chaque voyage devient une livraison" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Envoyer un colis/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Devenir livreur/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Voyager avec Yobalelma/ }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

for (const surface of publicSurfaces) {
  test(`${surface.path} renders its critical visual surface`, async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto(surface.path);
    await expect(page.getByRole("heading", { name: surface.heading })).toBeVisible();

    for (const text of surface.text) {
      await expectVisibleAfterScroll(page.getByText(text).first());
    }

    await expectNoHorizontalOverflow(page);

    await page.setViewportSize(mobile);
    await page.goto(surface.path);
    await expect(page.getByRole("heading", { name: surface.heading })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

test("dashboard protection remains presentable", async ({ page }) => {
  await page.setViewportSize(desktop);
  await page.goto("/dashboard");

  if (page.url().includes("/auth/sign-in")) {
    await expect(page.getByRole("heading", { name: "Connexion securisee" })).toBeVisible();
    await expect(page.getByText("Se connecter").first()).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Dashboard Yobalelma" })).toBeVisible();
    await expect(page.getByText(/Connecte-toi pour continuer|Configuration Supabase requise/)).toBeVisible();
  }

  await expectNoHorizontalOverflow(page);
});

async function expectVisibleAfterScroll(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body?.scrollWidth ?? 0;
    const viewportWidth = document.documentElement.clientWidth;

    return {
      contentWidth: Math.max(documentWidth, bodyWidth),
      viewportWidth,
    };
  });

  expect(metrics.contentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
}
