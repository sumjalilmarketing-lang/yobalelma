import { expect, test } from "@playwright/test";
import {
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
} from "../../../../tests/e2e/authenticated-helpers";
import { expectPublicPage } from "./user-app-test-utils";

test.describe.serial("user-app login and password reset", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("logs in with a test client and renders reset surfaces", async ({ page }) => {
    const user = await ensureE2EUser("client", "user-app-login");

    await expectPublicPage(page, "/auth/login", "Connexion securisee");
    await loginAs(page, user, "/client");
    await page.waitForURL((url) => url.pathname === "/client");
    await expect(page.getByRole("heading", { exact: true, name: "Espace client Yobalelma" }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { exact: true, name: "Espace client Yobalelma" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Deconnexion" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await page.goto("/client");
    await page.waitForURL((url) => url.pathname === "/auth/login");

    await expectPublicPage(page, "/auth/forgot-password", "Reinitialiser ton mot de passe");
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(
      page.getByText("Si un compte correspond à cette adresse, un lien de réinitialisation sera envoyé."),
    ).toBeVisible();
    await expectPublicPage(page, "/auth/reset-password", "Choisir un nouveau mot de passe");
    await expect(page.getByRole("button", { name: "Mettre a jour" })).toBeVisible();
  });
});
