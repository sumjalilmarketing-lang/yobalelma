import { expect, test } from "@playwright/test";
import { expectPublicPage } from "./user-app-test-utils";

test.describe("user-app client registration", () => {
  test("renders the signup form with public role choices", async ({ page }) => {
    await expectPublicPage(page, "/auth/register", "Creer ton compte Yobalelma");

    await expect(page.getByLabel("Nom complet")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Role souhaite")).toBeVisible();
    await expect(page.getByRole("button", { name: "Creer mon compte" })).toBeVisible();

    await page.getByLabel("Role souhaite").selectOption("client");
    await expect(page.getByLabel("Role souhaite")).toHaveValue("client");
    await page.getByLabel("Role souhaite").selectOption("local_transporter");
    await expect(page.getByLabel("Role souhaite")).toHaveValue("local_transporter");
    await page.getByLabel("Role souhaite").selectOption("traveler");
    await expect(page.getByLabel("Role souhaite")).toHaveValue("traveler");
  });
});
