import { expect, test, type Page } from "playwright/test";

export function protectedRouteSmoke(title: string, path: string) {
  test.describe(title, () => {
    test(`${path} redirects anonymous users`, async ({ page }) => {
      await expectAnonymousRedirect(page, path);
    });
  });
}

export async function expectAnonymousRedirect(page: Page, path: string) {
  await page.goto(path);

  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("heading", { name: "Connexion sécurisée" })).toBeVisible();
}
