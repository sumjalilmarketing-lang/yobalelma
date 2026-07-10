"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type ApiResult } from "@/lib/api/responses";
import { type TripFormInput, tripSchema, type TripInput } from "@/lib/validation/trip";

export function TripForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<TripFormInput, unknown, TripInput>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      originCity: "",
      originCountry: "",
      destinationCity: "",
      destinationCountry: "",
      departureDate: "",
      arrivalDate: "",
      availableWeightKg: 1,
      notes: "",
    },
  });

  async function onSubmit(values: TripInput) {
    setResult(null);
    const response = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setResult((await response.json()) as ApiResult);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ville de depart" error={form.formState.errors.originCity?.message}>
          <Input placeholder="Lyon" {...form.register("originCity")} />
        </Field>
        <Field label="Pays de depart" error={form.formState.errors.originCountry?.message}>
          <Input placeholder="France" {...form.register("originCountry")} />
        </Field>
        <Field
          label="Ville d'arrivee"
          error={form.formState.errors.destinationCity?.message}
        >
          <Input placeholder="Abidjan" {...form.register("destinationCity")} />
        </Field>
        <Field
          label="Pays d'arrivee"
          error={form.formState.errors.destinationCountry?.message}
        >
          <Input placeholder="Cote d'Ivoire" {...form.register("destinationCountry")} />
        </Field>
        <Field label="Date de depart" error={form.formState.errors.departureDate?.message}>
          <Input type="date" {...form.register("departureDate")} />
        </Field>
        <Field label="Date d'arrivee" error={form.formState.errors.arrivalDate?.message}>
          <Input type="date" {...form.register("arrivalDate")} />
        </Field>
        <Field
          label="Capacite disponible (kg)"
          error={form.formState.errors.availableWeightKg?.message}
        >
          <Input type="number" step="0.1" min="0.1" {...form.register("availableWeightKg")} />
        </Field>
      </div>
      <Field label="Notes de voyage" error={form.formState.errors.notes?.message}>
        <Textarea
          placeholder="Aeroport, contraintes bagage, type de colis accepte..."
          {...form.register("notes")}
        />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Publication..." : "Publier mon voyage"}
      </Button>
      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />
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
