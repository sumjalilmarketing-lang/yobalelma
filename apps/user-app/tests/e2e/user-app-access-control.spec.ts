import { test } from "@playwright/test";
import { expectProtectedRedirect, expectPublicPage } from "./user-app-test-utils";

const publicRoutes = [
  "/",
  "/how-it-works",
  "/security",
  "/pricing",
  "/tracking",
  "/relay-points",
  "/prohibited-items",
  "/support",
  "/terms",
  "/privacy",
  "/auth/login",
  "/auth/register",
  "/recipient/delivery"
];

const protectedRoutes = [
  "/client",
  "/client/shipments",
  "/client/shipments/new",
  "/transporter",
  "/transporter/missions",
  "/traveler",
  "/traveler/trips/new"
];

test.describe("user-app routes", () => {
  for (const route of publicRoutes) {
    test(`${route} renders publicly`, async ({ page }) => {
      await expectPublicPage(page, route);
    });
  }

  for (const route of protectedRoutes) {
    test(`${route} is protected`, async ({ page }) => {
      await expectProtectedRedirect(page, route);
    });
  }
});
