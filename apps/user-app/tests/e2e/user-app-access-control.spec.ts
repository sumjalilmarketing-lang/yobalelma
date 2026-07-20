import { test } from "@playwright/test";
import { expectProtectedRedirect, expectPublicPage } from "./user-app-test-utils";

const publicRoutes = [
  "/",
  "/how-it-works",
  "/security",
  "/pricing",
  "/tracking",
  "/tracking/YBL-ROUTE-CHECK",
  "/relay-points",
  "/prohibited-items",
  "/support",
  "/terms",
  "/privacy",
  "/auth/login",
  "/auth/register",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/envoyer",
  "/livreur",
  "/voyager",
  "/recipient/delivery",
  "/recipient/delivery/00000000-0000-4000-8000-000000000000",
  "/suivi",
  "/suivi/YBL-ROUTE-CHECK"
];

const protectedRoutes = [
  "/dashboard",
  "/client",
  "/client/addresses",
  "/client/messages",
  "/client/notifications",
  "/client/payments",
  "/client/profile",
  "/client/support",
  "/client/tracking",
  "/client/shipments",
  "/client/shipments/new",
  "/client/shipments/00000000-0000-4000-8000-000000000000",
  "/transporter",
  "/transporter/availability",
  "/transporter/earnings",
  "/transporter/kyc",
  "/transporter/missions",
  "/transporter/missions/active",
  "/transporter/missions/available",
  "/transporter/missions/history",
  "/transporter/missions/00000000-0000-4000-8000-000000000000",
  "/transporter/notifications",
  "/transporter/profile",
  "/transporter/ratings",
  "/transporter/support",
  "/transporter/vehicle",
  "/transporter/zones",
  "/traveler",
  "/traveler/assignments",
  "/traveler/capacity",
  "/traveler/earnings",
  "/traveler/history",
  "/traveler/kyc",
  "/traveler/notifications",
  "/traveler/payments",
  "/traveler/profile",
  "/traveler/qr-codes",
  "/traveler/support",
  "/traveler/tickets",
  "/traveler/trips",
  "/traveler/trips/new",
  "/traveler/trips/00000000-0000-4000-8000-000000000000"
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
