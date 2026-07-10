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
import {
  type ParcelRequestFormInput,
  parcelRequestSchema,
  type ParcelRequestInput,
} from "@/lib/validation/parcel-request";

export function ParcelRequestForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<ParcelRequestFormInput, unknown, ParcelRequestInput>({
    resolver: zodResolver(parcelRequestSchema),
    defaultValues: {
      originCity: "",
      originCountry: "",
      destinationCity: "",
      destinationCountry: "",
      packageType: "",
      weightKg: 1,
      deadline: "",
      description: "",
      declaredValueCents: 0,
    },
  });

  async function onSubmit(values: ParcelRequestInput) {
    setResult(null);
    const response = await fetch("/api/parcel-requests", {
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
          <Input placeholder="Paris" {...form.register("originCity")} />
        </Field>
        <Field label="Pays de depart" error={form.formState.errors.originCountry?.message}>
          <Input placeholder="France" {...form.register("originCountry")} />
        </Field>
        <Field
          label="Ville d'arrivee"
          error={form.formState.errors.destinationCity?.message}
        >
          <Input placeholder="Dakar" {...form.register("destinationCity")} />
        </Field>
        <Field
          label="Pays d'arrivee"
          error={form.formState.errors.destinationCountry?.message}
        >
          <Input placeholder="Senegal" {...form.register("destinationCountry")} />
        </Field>
        <Field label="Type de colis" error={form.formState.errors.packageType?.message}>
          <Input placeholder="Documents, vetements..." {...form.register("packageType")} />
        </Field>
        <Field label="Poids estime (kg)" error={form.formState.errors.weightKg?.message}>
          <Input type="number" step="0.1" min="0.1" {...form.register("weightKg")} />
        </Field>
        <Field label="Date limite" error={form.formState.errors.deadline?.message}>
          <Input type="date" {...form.register("deadline")} />
        </Field>
        <Field
          label="Valeur declaree (centimes)"
          error={form.formState.errors.declaredValueCents?.message}
        >
          <Input type="number" min="0" {...form.register("declaredValueCents")} />
        </Field>
      </div>
      <Field label="Description" error={form.formState.errors.description?.message}>
        <Textarea
          placeholder="Dimensions, fragilite, conditions de remise..."
          {...form.register("description")}
        />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Publication..." : "Publier la demande"}
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
