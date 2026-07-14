import { expect, test } from "playwright/test";
import { ensureE2EUser, loginAs, requireSupabaseAuthenticatedE2E } from "./authenticated-helpers";

test.describe("recipient absent reschedule", () => {
  requireSupabaseAuthenticatedE2E();

  test("relay agent can record recipient absence and reschedule", async ({ page }) => {
    const relay = await ensureE2EUser("relay_agent", "recipient-absent");

    await loginAs(page, relay, "/dashboard/relay/final-delivery");
    await expect(page.getByRole("heading", { name: "Journaliser un echec ou une reprise" })).toBeVisible();
    await expect(page.locator('select[name="status"]')).toContainText("Destinataire absent");
    await expect(page.locator('select[name="status"]')).toContainText("Reprogramme");
  });
});
