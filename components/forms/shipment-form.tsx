"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api/responses";
import {
  estimateShipment,
  formatMoney,
  type ShipmentEstimate,
} from "@/lib/shipments/estimation";
import {
  shipmentSchema,
  type ShipmentFormInput,
  type ShipmentInput,
} from "@/lib/validation/shipment";

type ShipmentResult = ApiResult<{
  estimate: ShipmentEstimate;
  shipmentId: string;
  trackingCode: string;
}>;

type ReviewState = {
  estimate: ShipmentEstimate;
  values: ShipmentInput;
};

export function ShipmentForm() {
  const [result, setResult] = useState<ShipmentResult | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const form = useForm<ShipmentFormInput, unknown, ShipmentInput>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      senderName: "",
      senderPhone: "",
      senderEmail: "",
      pickupAddressLine1: "",
      pickupAddressLine2: "",
      pickupCity: "",
      pickupPostalCode: "",
      pickupCountry: "",
      pickupInstructions: "",
      recipientName: "",
      recipientPhone: "",
      recipientEmail: "",
      deliveryAddressLine1: "",
      deliveryAddressLine2: "",
      deliveryCity: "",
      deliveryPostalCode: "",
      deliveryCountry: "",
      deliveryInstructions: "",
      packageTitle: "",
      packageCategory: "documents",
      packageDescription: "",
      weightKg: 1,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 5,
      declaredValueCents: 0,
      fragile: false,
      serviceLevel: "standard",
      preferredPickupDate: "",
      latestDeliveryDate: "",
      prohibitedItemsConfirmed: false,
      confirmationAccepted: false,
    },
  });

  async function onSubmit(values: ShipmentInput) {
    setResult(null);

    if (!review) {
      setReview({ estimate: estimateShipment(values), values });
      return;
    }

    const response = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review.values),
    });
    const payload = (await response.json()) as ShipmentResult;
    setResult(payload);

    if (payload.ok) {
      setReview(null);
      form.reset();
    }
  }

  return (
    <form
      className="grid gap-8"
      onChange={() => {
        if (review) {
          setReview(null);
        }
      }}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <Section title="Expediteur et enlevement">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom expediteur" error={form.formState.errors.senderName?.message}>
            <Input autoComplete="name" {...form.register("senderName")} />
          </Field>
          <Field label="Telephone expediteur" error={form.formState.errors.senderPhone?.message}>
            <Input autoComplete="tel" {...form.register("senderPhone")} />
          </Field>
          <Field label="Email expediteur" error={form.formState.errors.senderEmail?.message}>
            <Input type="email" autoComplete="email" {...form.register("senderEmail")} />
          </Field>
          <Field label="Pays de depart" error={form.formState.errors.pickupCountry?.message}>
            <Input autoComplete="country-name" {...form.register("pickupCountry")} />
          </Field>
          <Field label="Ville de depart" error={form.formState.errors.pickupCity?.message}>
            <Input autoComplete="address-level2" {...form.register("pickupCity")} />
          </Field>
          <Field label="Code postal depart" error={form.formState.errors.pickupPostalCode?.message}>
            <Input autoComplete="postal-code" {...form.register("pickupPostalCode")} />
          </Field>
        </div>
        <Field label="Adresse de depart" error={form.formState.errors.pickupAddressLine1?.message}>
          <Input autoComplete="address-line1" {...form.register("pickupAddressLine1")} />
        </Field>
        <Field label="Complement depart" error={form.formState.errors.pickupAddressLine2?.message}>
          <Input autoComplete="address-line2" {...form.register("pickupAddressLine2")} />
        </Field>
        <Field label="Instructions depart" error={form.formState.errors.pickupInstructions?.message}>
          <Textarea {...form.register("pickupInstructions")} />
        </Field>
      </Section>

      <Section title="Destinataire et livraison">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom destinataire" error={form.formState.errors.recipientName?.message}>
            <Input autoComplete="name" {...form.register("recipientName")} />
          </Field>
          <Field label="Telephone destinataire" error={form.formState.errors.recipientPhone?.message}>
            <Input autoComplete="tel" {...form.register("recipientPhone")} />
          </Field>
          <Field label="Email destinataire" error={form.formState.errors.recipientEmail?.message}>
            <Input type="email" autoComplete="email" {...form.register("recipientEmail")} />
          </Field>
          <Field label="Pays d'arrivee" error={form.formState.errors.deliveryCountry?.message}>
            <Input autoComplete="country-name" {...form.register("deliveryCountry")} />
          </Field>
          <Field label="Ville d'arrivee" error={form.formState.errors.deliveryCity?.message}>
            <Input autoComplete="address-level2" {...form.register("deliveryCity")} />
          </Field>
          <Field
            label="Code postal arrivee"
            error={form.formState.errors.deliveryPostalCode?.message}
          >
            <Input autoComplete="postal-code" {...form.register("deliveryPostalCode")} />
          </Field>
        </div>
        <Field
          label="Adresse d'arrivee"
          error={form.formState.errors.deliveryAddressLine1?.message}
        >
          <Input autoComplete="address-line1" {...form.register("deliveryAddressLine1")} />
        </Field>
        <Field
          label="Complement arrivee"
          error={form.formState.errors.deliveryAddressLine2?.message}
        >
          <Input autoComplete="address-line2" {...form.register("deliveryAddressLine2")} />
        </Field>
        <Field
          label="Instructions arrivee"
          error={form.formState.errors.deliveryInstructions?.message}
        >
          <Textarea {...form.register("deliveryInstructions")} />
        </Field>
      </Section>

      <Section title="Colis et engagement">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom du colis" error={form.formState.errors.packageTitle?.message}>
            <Input placeholder="Documents administratifs" {...form.register("packageTitle")} />
          </Field>
          <Field label="Categorie" error={form.formState.errors.packageCategory?.message}>
            <select
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              {...form.register("packageCategory")}
            >
              <option value="documents">Documents</option>
              <option value="clothing">Vetements</option>
              <option value="electronics">Electronique</option>
              <option value="food_dry">Alimentaire sec</option>
              <option value="cosmetics">Cosmetiques</option>
              <option value="other">Autre</option>
            </select>
          </Field>
          <Field label="Poids (kg)" error={form.formState.errors.weightKg?.message}>
            <Input type="number" step="0.1" min="0.1" {...form.register("weightKg")} />
          </Field>
          <Field label="Valeur declaree (centimes)" error={form.formState.errors.declaredValueCents?.message}>
            <Input type="number" min="0" {...form.register("declaredValueCents")} />
          </Field>
          <Field label="Longueur (cm)" error={form.formState.errors.lengthCm?.message}>
            <Input type="number" min="1" {...form.register("lengthCm")} />
          </Field>
          <Field label="Largeur (cm)" error={form.formState.errors.widthCm?.message}>
            <Input type="number" min="1" {...form.register("widthCm")} />
          </Field>
          <Field label="Hauteur (cm)" error={form.formState.errors.heightCm?.message}>
            <Input type="number" min="1" {...form.register("heightCm")} />
          </Field>
          <Field label="Service" error={form.formState.errors.serviceLevel?.message}>
            <select
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              {...form.register("serviceLevel")}
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
          </Field>
          <Field
            label="Date d'enlevement souhaitee"
            error={form.formState.errors.preferredPickupDate?.message}
          >
            <Input type="date" {...form.register("preferredPickupDate")} />
          </Field>
          <Field
            label="Date limite de livraison"
            error={form.formState.errors.latestDeliveryDate?.message}
          >
            <Input type="date" {...form.register("latestDeliveryDate")} />
          </Field>
        </div>
        <Field label="Description du colis" error={form.formState.errors.packageDescription?.message}>
          <Textarea
            placeholder="Contenu, emballage, fragilite, consignes importantes..."
            {...form.register("packageDescription")}
          />
        </Field>
        <label className="flex items-start gap-3 text-sm font-semibold">
          <input type="checkbox" className="mt-1" {...form.register("fragile")} />
          Colis fragile
        </label>
        <CheckboxField
          control={<input type="checkbox" className="mt-1" {...form.register("prohibitedItemsConfirmed")} />}
          error={form.formState.errors.prohibitedItemsConfirmed?.message}
        >
          Je confirme que le colis ne contient pas d&apos;objet interdit, dangereux ou
          non declare.
        </CheckboxField>
        <CheckboxField
          control={<input type="checkbox" className="mt-1" {...form.register("confirmationAccepted")} />}
          error={form.formState.errors.confirmationAccepted?.message}
        >
          Je confirme que les informations saisies sont exactes avant creation de
          l&apos;expedition.
        </CheckboxField>
      </Section>

      {review ? <ReviewPanel review={review} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Creation..."
            : review
              ? "Confirmer et creer l'expedition"
              : "Verifier l'expedition"}
        </Button>
        {review ? (
          <Button type="button" variant="ghost" onClick={() => setReview(null)}>
            Modifier
          </Button>
        ) : null}
      </div>

      {result?.ok ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-black text-emerald-950">
            Code de suivi : {result.data?.trackingCode}
          </p>
          <p className="mt-1 text-sm text-emerald-900">{result.message}</p>
        </div>
      ) : (
        <FormMessage
          message={result?.message}
          tone={result ? (result.ok ? "success" : "error") : "info"}
        />
      )}
    </form>
  );
}

function ReviewPanel({ review }: { review: ReviewState }) {
  return (
    <section className="rounded-lg border border-primary/35 bg-primary/10 p-5">
      <h3 className="text-xl font-black">Verification avant creation</h3>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <Summary label="Trajet" value={`${review.values.pickupCity} -> ${review.values.deliveryCity}`} />
        <Summary
          label="Type"
          value={review.estimate.scope === "national" ? "National" : "International"}
        />
        <Summary label="Prix estime" value={formatMoney(review.estimate.priceCents)} />
        <Summary
          label="Delai estime"
          value={`${review.estimate.etaMinDays}-${review.estimate.etaMaxDays} jours`}
        />
        <Summary
          label="Poids facturable"
          value={`${review.estimate.billableWeightKg.toFixed(1)} kg`}
        />
        <Summary
          label="Colis"
          value={`${review.values.packageTitle}, ${review.values.weightKg} kg`}
        />
      </div>
      <p className="mt-4 text-sm font-semibold text-black/62">
        Le code de suivi `YBL-XXXXXXXX` sera genere au moment de la confirmation.
      </p>
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function CheckboxField({
  control,
  error,
  children,
}: {
  control: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 rounded-md border border-black/10 p-3 text-sm font-semibold">
      <span className="flex items-start gap-3">
        {control}
        <span>{children}</span>
      </span>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-bold uppercase text-black/45">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
