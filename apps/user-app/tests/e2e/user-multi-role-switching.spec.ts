import { expect, test } from "@playwright/test";
import {
  createAdminClient,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
} from "../../../../tests/e2e/authenticated-helpers";

test.describe.serial("user-app multirole switching", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("shows only assigned user spaces and switches between them", async ({ page }) => {
    const user = await ensureE2EUser("client", "user-app-multirole");
    const supabase = createAdminClient();

    for (const role of ["local_transporter", "traveler"] as const) {
      await supabase.from("user_roles").upsert(
        {
          profile_id: user.id,
          role_id: role,
        },
        { onConflict: "profile_id,role_id" },
      );

      const { data: existing } = await supabase
        .from("role_assignments")
        .select("id")
        .eq("profile_id", user.id)
        .eq("role", role)
        .eq("status", "active")
        .maybeSingle();

      if (!existing) {
        await supabase.from("role_assignments").insert({
          profile_id: user.id,
          reason: "user_app_multirole_e2e",
          role,
          status: "active",
        });
      }
    }

    await loginAs(page, user, "/client");
    await page.waitForURL((url) => url.pathname === "/client");

    await expect(page.getByRole("link", { exact: true, name: "Espace client" })).toBeVisible();
    await expect(page.getByRole("link", { exact: true, name: "Espace livreur" })).toBeVisible();
    await expect(page.getByRole("link", { exact: true, name: "Espace voyageur" })).toBeVisible();

    await page.getByRole("link", { exact: true, name: "Espace voyageur" }).click();
    await page.waitForURL((url) => url.pathname === "/traveler");
    await expect(page.getByRole("heading", { exact: true, name: "Espace voyageur Yobalelma" }).first()).toBeVisible();

    await page.getByRole("link", { exact: true, name: "Espace livreur" }).click();
    await page.waitForURL((url) => url.pathname === "/transporter");
    await expect(page.getByRole("heading", { exact: true, name: "Espace livreur local" }).first()).toBeVisible();
  });
});
