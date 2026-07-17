import path from "node:path";
import { expect, type Page } from "@playwright/test";

const accounts = {
  hub_agent: {
    code: "HUB-AGENT",
    email: "agent.hub@yobalelma.test",
  },
  hub_supervisor: {
    code: "HUB-SUPERVISOR",
    email: "supervisor.hub@yobalelma.test",
  },
  hub_manager: {
    code: "HUB-MANAGER",
    email: "manager.hub@yobalelma.test",
  },
  operations_manager: {
    code: "OPS-READ",
    email: "operations@yobalelma.test",
  },
} as const;

export type E2EHubRole = keyof typeof accounts;

export async function signInHub(page: Page, role: E2EHubRole = "hub_agent") {
  const account = accounts[role];

  await page.goto("/auth/sign-in");
  await page.getByLabel("Compte test").selectOption(account.email);
  await page.getByLabel("Role").selectOption(role);
  await page.getByLabel("Code operateur").fill(account.code);
  await page.getByRole("button", { name: "Entrer dans le Hub" }).click();
  await expect(page).toHaveURL(/\/hub/);
  await expect(page.getByText("Centre operationnel Hub")).toBeVisible();
}

export async function resetHub(page: Page) {
  const response = await page.request.post("/api/hub/test/reset");
  expect(response.ok()).toBeTruthy();
}

export async function prepareParisShipment(page: Page) {
  await page.request.post("/api/hub/inbound/scan", {
    form: {
      manifestId: "manifest-dss-002",
      returnTo: "/hub/scanner",
      status: "received_at_hub",
      trackingCode: "YBL-DSS-CDG-006",
    },
  });
  await page.request.post("/api/hub/inspection", {
    form: {
      decision: "approved",
      measuredWeightKg: "7.5",
      note: "Controle E2E conforme",
      packagingQuality: "excellent",
      returnTo: "/hub/inspection/shp-006",
      shipmentId: "shp-006",
    },
  });
}

export async function generatePickupQr(page: Page, batchId = "batch-cdg-001") {
  await page.request.post("/api/hub/batches/qr", {
    form: {
      batchId,
      returnTo: `/hub/batches/${batchId}`,
    },
  });
}

export function visualPath(fileName: string) {
  return path.resolve(process.cwd(), "../../docs/visual-demo/hub-app", fileName);
}
