import { expect, test } from "playwright/test";
import {
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
  type E2ERole,
} from "./authenticated-helpers";

const anonymousProtectedRoutes = [
  "/dashboard/client/international",
  "/dashboard/transporter/international",
  "/dashboard/relay/international",
  "/dashboard/relay/destination-reception",
  "/dashboard/collection/international",
  "/dashboard/hub/international",
  "/dashboard/hub/capacities",
  "/dashboard/traveler/international",
  "/dashboard/admin/international",
];

const roleRoutes: Array<{
  heading: string;
  role: E2ERole;
  route: string;
}> = [
  { heading: "Parcours international client", role: "client", route: "/dashboard/client/international" },
  { heading: "Premier kilometre international", role: "local_transporter", route: "/dashboard/transporter/international" },
  { heading: "Relais international", role: "relay_agent", route: "/dashboard/relay/international" },
  { heading: "Collecte relais vers hub", role: "collection_driver", route: "/dashboard/collection/international" },
  { heading: "Hub international", role: "hub_agent", route: "/dashboard/hub/international" },
  { heading: "Voyageur international", role: "traveler", route: "/dashboard/traveler/international" },
  { heading: "Supervision internationale", role: "admin", route: "/dashboard/admin/international" },
];

test.describe("international operational route protection", () => {
  for (const route of anonymousProtectedRoutes) {
    test(`${route} redirects anonymous users`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL(/\/auth\/sign-in/);
      await expect(page.getByRole("heading", { name: "Connexion sécurisée" })).toBeVisible();
    });
  }
});

test.describe("international operational route rendering", () => {
  requireSupabaseAuthenticatedE2E();

  for (const { heading, role, route } of roleRoutes) {
    test(`${role} can open ${route}`, async ({ page }) => {
      const user = await ensureE2EUser(role, "international-operational-routes");

      await loginAs(page, user, route);
      try {
        await page.waitForURL((url) => url.pathname === route, { timeout: 15_000 });
      } catch {
        await page.goto(route);
        await page.waitForURL((url) => url.pathname === route, { timeout: 15_000 });
      }
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByText("Parcours international").first()).toBeVisible();
    });
  }
});
