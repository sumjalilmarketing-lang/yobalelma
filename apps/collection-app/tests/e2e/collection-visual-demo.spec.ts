import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

test("generate Collection App demonstration screenshots", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const baseURL=process.env.PLAYWRIGHT_BASE_URL??"http://localhost:43231"; await page.goto(`${baseURL}/auth/sign-in`);
  if (process.env.COLLECTION_E2E_EMAIL && process.env.COLLECTION_E2E_PASSWORD) {
    await page.getByLabel("Email professionnel").fill(process.env.COLLECTION_E2E_EMAIL); await page.getByLabel("Mot de passe").fill(process.env.COLLECTION_E2E_PASSWORD); await page.getByRole("button",{name:"Ouvrir ma tournée"}).click();
  } else {
    await page.request.post("/api/auth/collection-sign-in",{form:{email:"driver.collection@yobalelma.test",code:"COL-DRIVER",role:"collection_driver",returnTo:"/collection"},maxRedirects:0}); await page.goto(`${baseURL}/collection`);
  }
  await expect(page).toHaveURL(/\/collection/u);
  const output=path.resolve(process.cwd(),"../../docs/visual-demo/collection-app"); await mkdir(output,{recursive:true});
  if(testInfo.project.name!=="desktop"){await page.goto(`${baseURL}/collection`);await expect(page.locator("main h1")).toBeVisible();await page.screenshot({path:path.join(output,testInfo.project.name==="mobile"?"09-mobile.png":"10-tablette.png"),fullPage:true});return;}
  const views=[
    ["01-dashboard","/collection"],["02-missions","/collection/missions"],["03-navigation","/collection/navigation"],
    ["04-scanner","/collection/scanner"],["05-inventaire","/collection/inventory"],["06-vehicule","/collection/vehicle"],
    ["07-anomalies-ia","/collection/anomalies"],["08-mode-hors-ligne","/collection/offline"],
  ];
  for(const [name,url] of views){await page.goto(url);await expect(page.locator("main h1")).toBeVisible();await page.screenshot({path:path.join(output,`${name}.png`),fullPage:true});}
});
