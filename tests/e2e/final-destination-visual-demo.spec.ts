import { mkdir } from "node:fs/promises";
import { expect, type Page, test } from "playwright/test";
import {
  createAdminClient,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
  type E2EUser,
} from "./authenticated-helpers";

const screenshotDir = "docs/visual-demo/final-delivery";

type DemoTarget = {
  shipmentId: string;
  trackingCode: string;
};

type DemoScreen = {
  file: string;
  heading: string | RegExp;
  route: string;
  user?: E2EUser;
};

test.describe("final destination visual demo", () => {
  requireSupabaseAuthenticatedE2E();

  test("captures relay, recipient, client and admin final delivery surfaces", async ({ page }) => {
    test.setTimeout(180_000);

    const client = await ensureE2EUser("client");
    const relay = await ensureE2EUser("relay_agent", "final-destination-visual");
    const admin = await ensureE2EUser("admin", "final-destination-visual");
    const target = await loadDemoTarget(client.id);

    test.skip(!target, "A final delivery shipment is required before visual capture.");

    await mkdir(screenshotDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1200 });

    const screens: DemoScreen[] = [
      {
        file: "01-relay-destination-reception.png",
        heading: "Reception destination",
        route: "/dashboard/relay/destination-reception",
        user: relay,
      },
      {
        file: "02-relay-inventory.png",
        heading: "Inventaire relais",
        route: "/dashboard/relay/inventory",
        user: relay,
      },
      {
        file: "03-relay-final-delivery-overview.png",
        heading: "Livraison finale destination",
        route: "/dashboard/relay/final-delivery",
        user: relay,
      },
      {
        file: "04-relay-final-delivery-detail-otp-proof.png",
        heading: "Detail livraison finale",
        route: `/dashboard/relay/final-delivery/${target.shipmentId}`,
        user: relay,
      },
      {
        file: "05-relay-anomalies.png",
        heading: "Anomalies relais",
        route: "/dashboard/relay/anomalies",
        user: relay,
      },
      {
        file: "06-relay-tracking.png",
        heading: "Tracking relais international",
        route: "/dashboard/relay/tracking",
        user: relay,
      },
      {
        file: "07-recipient-delivery-overview.png",
        heading: "Remise de colis",
        route: "/recipient/delivery",
        user: client,
      },
      {
        file: "08-recipient-delivery-detail.png",
        heading: "Remise de colis",
        route: `/recipient/delivery/${target.shipmentId}`,
        user: client,
      },
      {
        file: "09-public-tracking-final-delivery.png",
        heading: target.trackingCode,
        route: `/tracking/${target.trackingCode}`,
      },
      {
        file: "10-client-shipment-proof-summary.png",
        heading: "Detail expedition",
        route: `/dashboard/client/shipments/${target.shipmentId}`,
        user: client,
      },
      {
        file: "11-client-notifications.png",
        heading: "Notifications",
        route: "/dashboard/client/notifications",
        user: client,
      },
      {
        file: "12-admin-manual-corrections.png",
        heading: "Corrections manuelles",
        route: "/dashboard/admin/manual-corrections",
        user: admin,
      },
      {
        file: "13-admin-otp-events.png",
        heading: "OTP events",
        route: "/dashboard/admin/otp-events",
        user: admin,
      },
      {
        file: "14-admin-proof-of-delivery.png",
        heading: "Proof of delivery",
        route: "/dashboard/admin/proof-of-delivery",
        user: admin,
      },
      {
        file: "15-admin-payout-review.png",
        heading: "Revue payout",
        route: "/dashboard/admin/payout-review",
        user: admin,
      },
      {
        file: "16-admin-audit-logs.png",
        heading: "Audit logs livraison finale",
        route: "/dashboard/admin/audit-logs",
        user: admin,
      },
    ];

    for (const screen of screens) {
      await captureScreen(page, screen);
    }
  });
});

async function captureScreen(page: Page, screen: DemoScreen) {
  if (screen.user) {
    await loginAs(page, screen.user, screen.route);
  } else {
    await page.goto(screen.route);
  }

  await page.waitForURL((url) => url.pathname === screen.route, { timeout: 15_000 }).catch(() => null);
  await expect(page.getByRole("heading", { level: 1, name: screen.heading })).toBeVisible({
    timeout: 20_000,
  });
  await page.screenshot({
    fullPage: true,
    path: `${screenshotDir}/${screen.file}`,
  });
}

async function loadDemoTarget(senderId: string): Promise<DemoTarget | null> {
  const supabase = createAdminClient();
  const { data: senderShipment, error: senderError } = await supabase
    .from("shipments")
    .select("id, tracking_code")
    .eq("sender_id", senderId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!senderError && senderShipment?.id && senderShipment.tracking_code) {
    return {
      shipmentId: senderShipment.id,
      trackingCode: senderShipment.tracking_code,
    };
  }

  const { data: finalDeliveryShipment, error: finalDeliveryError } = await supabase
    .from("final_delivery_orders")
    .select("shipment_id, shipments(tracking_code)")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (finalDeliveryError || !finalDeliveryShipment?.shipment_id) {
    return null;
  }

  const shipment = Array.isArray(finalDeliveryShipment.shipments)
    ? finalDeliveryShipment.shipments[0]
    : finalDeliveryShipment.shipments;

  if (!shipment?.tracking_code) {
    return null;
  }

  return {
    shipmentId: finalDeliveryShipment.shipment_id,
    trackingCode: shipment.tracking_code,
  };
}
