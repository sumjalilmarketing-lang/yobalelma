import { expect, test } from "@playwright/test";

async function signIn(page) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:43231";
  await page.goto(`${baseURL}/auth/sign-in`);
  if (process.env.COLLECTION_E2E_EMAIL && process.env.COLLECTION_E2E_PASSWORD) {
    await page.getByLabel("Email professionnel").fill(process.env.COLLECTION_E2E_EMAIL);
    await page.getByLabel("Mot de passe").fill(process.env.COLLECTION_E2E_PASSWORD);
    await page.getByRole("button", { name: "Ouvrir ma tournée" }).click();
    await expect(page).toHaveURL(/\/collection/u);
    return true;
  }
  await expect(page.getByLabel("Identifiant de formation")).toBeVisible();
  const response = await page.request.post("/api/auth/collection-sign-in", { form: { email: "driver.collection@yobalelma.test", code: "COL-DRIVER", role: "collection_driver", returnTo: "/collection" }, maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "yb_collection_session")).toBe(true);
  await page.goto(`${baseURL}/collection`);
  await expect(page).toHaveURL(/\/collection/u);
  return false;
}

test("driver can inspect the core journey without simulated confirmations", async ({ page, context }) => {
  const liveSession = await signIn(page);
  await expect(page.getByRole("heading", { name: /Bonjour Ibrahima/u })).toBeVisible();
  if (!liveSession) {
    for (const route of ["missions", "navigation", "scanner", "offline", "vehicle"]) {
      await page.goto(`/collection/${route}`);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("main")).not.toHaveText("");
    }
    await page.goto("/collection/scanner");
    await expect(page.getByRole("button", { name: "Valider la référence" })).toBeDisabled();
    await expect(page.getByRole("status")).toHaveCount(0);
    return;
  }
  await page.goto("/collection/missions"); await expect(page.locator("main")).toBeVisible();
  await page.goto("/collection/navigation"); await expect(page.locator("main")).toBeVisible();
  await page.goto("/collection/scanner"); await expect(page.getByLabel("Code colis")).toBeVisible(); await expect(page.getByRole("button", { name: "Valider la référence" })).toBeEnabled();
  await page.goto("/collection/offline"); await expect(page.getByRole("heading", { name: "Continuité hors ligne" })).toBeVisible(); await context.setOffline(true); await expect(page.getByLabel("Statut réseau : hors ligne")).toBeVisible(); await context.setOffline(false);
  await page.goto("/collection/vehicle"); await expect(page.locator("main")).toBeVisible();
});

test("all driver modules render professional content", async ({ page }) => {
  test.setTimeout(180_000);
  await signIn(page);
  const routes=["missions","route-optimization","map","navigation","scanner","loading","unloading","quantities","batches","inventory","photos","signatures","history","incidents","anomalies","notifications","messages","planning","vehicle","maintenance","mileage","fuel","driver-documents","vehicle-documents","offline","sync","support","profile"];
  for (const route of routes) { const response=await page.goto(`/collection/${route}`); expect(response?.ok(),route).toBeTruthy(); await expect(page.locator("main")).toBeVisible(); await expect(page.locator("main")).not.toHaveText(""); }
});

test("responsive shell has mobile navigation", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile")); await signIn(page); await expect(page.getByRole("navigation", { name: "Navigation mobile" })).toBeVisible();
});

test("manager permissions and security headers are enforced", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  const baseURL=process.env.PLAYWRIGHT_BASE_URL??"http://localhost:43231";
  const signInResponse=await page.request.post("/api/auth/collection-sign-in",{form:{email:"manager.collection@yobalelma.test",code:"COL-MANAGER",role:"collection_manager",returnTo:"/collection/settings"},maxRedirects:0});
  expect(signInResponse.status()).toBe(303);
  const settingsResponse=await page.goto("/collection/settings"); expect(settingsResponse?.ok()).toBeTruthy(); await expect(page.getByRole("heading",{name:"Paramètres"})).toBeVisible();
  expect(settingsResponse?.headers()["content-security-policy"]).toBeTruthy(); expect(settingsResponse?.headers()["x-frame-options"]).toBeTruthy();
  await page.context().clearCookies(); await signIn(page); await page.goto(`${baseURL}/collection/settings`); await expect(page).toHaveURL(new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&")}/collection$`,"u"));
});
