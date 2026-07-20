import { expect, test } from "@playwright/test";

const password = process.env.ADMIN_E2E_PASSWORD;
test.skip(!password, "ADMIN_E2E_PASSWORD is required for authenticated tests.");

async function signIn(page, email = "pilot.command@yobalelma.test") {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email professionnel").fill(email);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Ouvrir le centre de commandement" }).click();
  await expect(page).toHaveURL(/\/command/u, { timeout: 20_000 });
}

test("platform governance sees every direction and can create a controlled mission", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Centre de commandement" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Finance", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sécurité", exact: true })).toBeVisible();
  await page.goto("/command/missions");
  await page.getByLabel("Intitulé").fill("Contrôler la coordination pilote");
  await page.getByLabel("Description").fill("Vérifier les responsabilités, les délais et la preuve de contrôle avant validation.");
  await page.getByRole("button", { name: "Créer la mission" }).click();
  await expect(page.getByText("Mission créée et enregistrée dans le circuit de suivi.")).toBeVisible();
});

test("a service manager only sees the assigned direction", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await signIn(page, "pilot.finance@yobalelma.test");
  await expect(page.getByRole("link", { name: "Finance", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Opérations", exact: true })).toHaveCount(0);
  const response = await page.goto("/command/directions/operations");
  expect(response?.status()).toBe(404);
});

test("the command center remains usable on mobile and tablet", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop");
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Centre de commandement" })).toBeVisible();
  await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Directions" })).toBeVisible();
});
