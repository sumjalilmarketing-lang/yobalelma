import { expect, test } from "@playwright/test";
import {
  createAdminClient,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
} from "../../../../tests/e2e/authenticated-helpers";

test.describe.serial("user-app secure identity documents", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("uploads an identity document without exposing its storage path", async ({ page }) => {
    const user = await ensureE2EUser("traveler", "user-secure-upload");
    const admin = createAdminClient();
    let uploadedPath: string | undefined;

    try {
      await loginAs(page, user, "/traveler/kyc");
      await page.waitForURL((url) => url.pathname === "/traveler/kyc");

      const prepared = page.waitForResponse((response) =>
        response.url().endsWith("/api/storage/signed-upload") &&
        response.request().method() === "POST",
      );

      await page.locator('input[type="file"]').first().setInputFiles({
        name: "identite-test.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          "base64",
        ),
      });

      const preparation = await (await prepared).json() as {
        data?: { path?: string };
      };
      uploadedPath = preparation.data?.path;

      await expect(page.getByText("Document ajouté en toute sécurité.")).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(/rgcgtcycbiuhcaoaadbh|kyc-documents|storage/i)).toHaveCount(0);
      expect(uploadedPath).toMatch(new RegExp(`^${user.id}/`));
    } finally {
      if (uploadedPath) {
        await admin.storage.from("kyc-documents").remove([uploadedPath]);
      }
    }
  });
});
