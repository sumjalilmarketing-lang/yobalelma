import { mkdir } from "node:fs/promises";
import { expect, test } from "playwright/test";
import {
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
  type E2ERole,
} from "./authenticated-helpers";

const screenshotDir = "docs/visual-demo/international";

const demoScreens: Array<{
  file: string;
  heading: string;
  role: E2ERole;
  route: string;
}> = [
  {
    file: "01-client-international.png",
    heading: "Parcours international client",
    role: "client",
    route: "/dashboard/client/international",
  },
  {
    file: "02-relay-destination-reception.png",
    heading: "Reception destination",
    role: "relay_agent",
    route: "/dashboard/relay/destination-reception",
  },
  {
    file: "03-collection-international.png",
    heading: "Collecte relais vers hub",
    role: "collection_driver",
    route: "/dashboard/collection/international",
  },
  {
    file: "04-hub-international.png",
    heading: "Hub international",
    role: "hub_agent",
    route: "/dashboard/hub/international",
  },
  {
    file: "05-traveler-international.png",
    heading: "Voyageur international",
    role: "traveler",
    route: "/dashboard/traveler/international",
  },
  {
    file: "06-admin-international.png",
    heading: "Supervision internationale",
    role: "admin",
    route: "/dashboard/admin/international",
  },
];

test.describe("international visual demo", () => {
  requireSupabaseAuthenticatedE2E();

  for (const screen of demoScreens) {
    test(`captures ${screen.route}`, async ({ page }) => {
      const user = await ensureE2EUser(screen.role, "international-visual-demo");

      await mkdir(screenshotDir, { recursive: true });
      await page.setViewportSize({ width: 1440, height: 1200 });
      await loginAs(page, user, screen.route);

      try {
        await page.waitForURL((url) => url.pathname === screen.route, { timeout: 15_000 });
      } catch {
        await page.goto(screen.route);
        await page.waitForURL((url) => url.pathname === screen.route, { timeout: 15_000 });
      }

      await expect(page.getByRole("heading", { name: screen.heading })).toBeVisible();
      await expect(page.getByText("Parcours international").first()).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: `${screenshotDir}/${screen.file}`,
      });
    });
  }
});
