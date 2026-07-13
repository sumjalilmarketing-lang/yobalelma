"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiResult } from "@/lib/api/responses";
import {
  travelDocumentSchema,
  type TravelDocumentFormInput,
  type TravelDocumentInput,
} from "@/lib/validation/hub";

export function TravelDocumentForm() {
  const [result, setResult] = useState<ApiResult<{ documentId?: string }> | null>(null);
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
      tripId: "",
    },
  });

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
      <Field label="ID trajet" error={form.formState.errors.tripId?.message}>
        <Input {...form.register("tripId")} />
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
        <Field label="Fichier billet/document" error={form.formState.errors.filePath?.message}>
          <Input placeholder="travel/user/ticket.pdf" {...form.register("filePath")} />
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
      <Button type="submit" disabled={form.formState.isSubmitting}>Soumettre le document</Button>
      {result?.ok && result.data?.documentId ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Document ID : {result.data.documentId}
        </p>
      ) : null}
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
