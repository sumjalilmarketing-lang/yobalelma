import type { ShipmentInput } from "@/lib/validation/shipment";

export type ShipmentScope = "national" | "international";

export type ShipmentEstimate = {
  scope: ShipmentScope;
  currency: "EUR";
  priceCents: number;
  etaMinDays: number;
  etaMaxDays: number;
  billableWeightKg: number;
  volumeWeightKg: number;
};

export type DigitalParcelTwin = {
  version: 1;
  route: {
    origin: {
      city: string;
      country: string;
    };
    destination: {
      city: string;
      country: string;
    };
    scope: ShipmentScope;
  };
  package: {
    category: ShipmentInput["packageCategory"];
    title: string;
    weightKg: number;
    dimensionsCm: {
      length: number;
      width: number;
      height: number;
    };
    fragile: boolean;
    declaredValueCents: number;
  };
  estimate: ShipmentEstimate;
  commitments: {
    preferredPickupDate: string;
    latestDeliveryDate: string;
    prohibitedItemsConfirmed: boolean;
    confirmationAccepted: boolean;
  };
};

export function normalizeCountry(country: string) {
  return country.trim().toLocaleLowerCase("fr-FR");
}

export function detectShipmentScope(originCountry: string, destinationCountry: string) {
  return normalizeCountry(originCountry) === normalizeCountry(destinationCountry)
    ? "national"
    : "international";
}

export function detectShipmentType(
  originCountryCode: string,
  destinationCountryCode: string,
) {
  return detectShipmentScope(originCountryCode, destinationCountryCode);
}

export function estimateShipment(input: ShipmentInput): ShipmentEstimate {
  const scope = detectShipmentScope(input.pickupCountry, input.deliveryCountry);
  const volumeWeightKg =
    (input.lengthCm * input.widthCm * input.heightCm) / (scope === "national" ? 6000 : 5000);
  const billableWeightKg = roundWeight(Math.max(input.weightKg, volumeWeightKg));
  const routeBaseCents = scope === "national" ? 700 : 2200;
  const weightCents = Math.ceil(billableWeightKg * (scope === "national" ? 180 : 420));
  const fragileCents = input.fragile ? 350 : 0;
  const declaredValueCents = Math.ceil(input.declaredValueCents * 0.015);
  const serviceMultiplier = input.serviceLevel === "express" ? 1.35 : 1;
  const priceCents = roundToNearestTen(
    (routeBaseCents + weightCents + fragileCents + declaredValueCents) * serviceMultiplier,
  );

  const baseEta: Pick<ShipmentEstimate, "etaMinDays" | "etaMaxDays"> =
    scope === "national" ? { etaMinDays: 1, etaMaxDays: 3 } : { etaMinDays: 3, etaMaxDays: 10 };

  return {
    scope,
    currency: "EUR",
    priceCents,
    etaMinDays: input.serviceLevel === "express" ? Math.max(1, baseEta.etaMinDays - 1) : baseEta.etaMinDays,
    etaMaxDays: input.serviceLevel === "express" ? Math.max(2, baseEta.etaMaxDays - 2) : baseEta.etaMaxDays,
    billableWeightKg,
    volumeWeightKg: roundWeight(volumeWeightKg),
  };
}

export function buildDigitalParcelTwin(
  input: ShipmentInput,
  estimate: ShipmentEstimate,
): DigitalParcelTwin {
  return {
    version: 1,
    route: {
      origin: {
        city: input.pickupCity,
        country: input.pickupCountry,
      },
      destination: {
        city: input.deliveryCity,
        country: input.deliveryCountry,
      },
      scope: estimate.scope,
    },
    package: {
      category: input.packageCategory,
      title: input.packageTitle,
      weightKg: input.weightKg,
      dimensionsCm: {
        length: input.lengthCm,
        width: input.widthCm,
        height: input.heightCm,
      },
      fragile: input.fragile,
      declaredValueCents: input.declaredValueCents,
    },
    estimate,
    commitments: {
      preferredPickupDate: input.preferredPickupDate,
      latestDeliveryDate: input.latestDeliveryDate,
      prohibitedItemsConfirmed: input.prohibitedItemsConfirmed,
      confirmationAccepted: input.confirmationAccepted,
    },
  };
}

export function formatMoney(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function roundWeight(value: number) {
  return Math.ceil(value * 10) / 10;
}

function roundToNearestTen(value: number) {
  return Math.ceil(value / 10) * 10;
}
