"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { SecureUploadField } from "@/components/forms/secure-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ApiResult } from "@/lib/api/responses";
import {
  travelDocumentSchema,
  type TravelDocumentFormInput,
  type TravelDocumentInput,
} from "@/lib/validation/hub";

type TripOption = { id: string; label: string };

export function TravelDocumentForm({ initialTripId = "" }: { initialTripId?: string }) {
  const [result, setResult] = useState<ApiResult<{ documentId?: string }> | null>(null);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const form = useForm<TravelDocumentFormInput, unknown, TravelDocumentInput>({
    resolver: zodResolver(travelDocumentSchema),
    defaultValues: {
      arrivalAirport: "",
      arrivalDate: "",
      departureAirport: "",
      departureDate: "",
      documentNumber: "",
      filePath: "",
      issuingCountry: "",
      travelerName: "",
      tripId: initialTripId,
    },
  });

  useEffect(() => {
    let active = true;
    void fetch("/api/trips")
      .then((response) => response.json() as Promise<ApiResult<{ trips: TripOption[] }>>)
      .then((payload) => {
        if (!active || !payload.ok) return;
        setTrips(payload.data?.trips ?? []);
        if (!form.getValues("tripId") && payload.data?.trips[0]) {
          form.setValue("tripId", payload.data.trips[0].id, { shouldValidate: true });
        }
      });
    return () => { active = false; };
  }, [form]);

  async function onSubmit(values: TravelDocumentInput) {
    const response = await fetch("/api/travel-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setResult((await response.json()) as ApiResult<{ documentId?: string }>);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Document de voyage</h2>
      <Field label="Voyage concerné" error={form.formState.errors.tripId?.message}>
        <Select {...form.register("tripId")} disabled={Boolean(initialTripId)}>
          {initialTripId && !trips.some((trip) => trip.id === initialTripId) ? (
            <option value={initialTripId}>Voyage en cours</option>
          ) : null}
          {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.label}</option>)}
        </Select>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom voyageur" error={form.formState.errors.travelerName?.message}>
          <Input {...form.register("travelerName")} />
        </Field>
        <Field label="Numero document" error={form.formState.errors.documentNumber?.message}>
          <Input {...form.register("documentNumber")} />
        </Field>
        <Field label="Pays emetteur" error={form.formState.errors.issuingCountry?.message}>
          <Input {...form.register("issuingCountry")} />
        </Field>
        <Field label="Aeroport depart" error={form.formState.errors.departureAirport?.message}>
          <Input placeholder="CDG" {...form.register("departureAirport")} />
        </Field>
        <Field label="Aeroport arrivee" error={form.formState.errors.arrivalAirport?.message}>
          <Input placeholder="DSS" {...form.register("arrivalAirport")} />
        </Field>
        <Field label="Date depart" error={form.formState.errors.departureDate?.message}>
          <Input type="date" {...form.register("departureDate")} />
        </Field>
        <Field label="Date arrivee" error={form.formState.errors.arrivalDate?.message}>
          <Input type="date" {...form.register("arrivalDate")} />
        </Field>
      </div>
      <input type="hidden" {...form.register("filePath")} />
      <SecureUploadField
        accept="image/jpeg,image/png,image/webp,application/pdf"
        bucket="flight-tickets"
        label="Billet ou justificatif de voyage"
        onUploaded={(path) => form.setValue("filePath", path, { shouldValidate: true })}
      />
      {form.formState.errors.filePath ? (
        <span className="text-sm text-red-700">Ajoute le billet ou le justificatif du voyage.</span>
      ) : null}
      <Button type="submit" disabled={form.formState.isSubmitting}>Soumettre le document</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
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
