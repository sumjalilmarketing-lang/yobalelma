import { expect, type Page } from "@playwright/test";

export async function expectPublicPage(page: Page, route: string, marker?: string | RegExp) {
  const response = await page.goto(route);
  expect(response?.status(), route).toBeLessThan(400);

  if (marker) {
    await expect(page.getByText(marker).first()).toBeVisible();
  }
}

export async function expectProtectedRedirect(page: Page, route: string) {
  await page.goto(route);
  await expect(page).toHaveURL(/\/auth\/login/);
}

export async function expectAuthedPage(page: Page, route: string, marker: string | RegExp) {
  const response = await page.goto(route);
  expect(response?.status(), route).toBeLessThan(400);
  await expect(page.getByText(marker).first()).toBeVisible();
}
