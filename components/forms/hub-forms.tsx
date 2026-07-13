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
  hubBatchAssignmentSchema,
  hubBatchSchema,
  type HubBatchAssignmentFormInput,
  type HubBatchAssignmentInput,
  type HubBatchFormInput,
  type HubBatchInput,
} from "@/lib/validation/hub";

export function HubForms() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <HubBatchForm />
      <HubBatchAssignmentForm />
    </div>
  );
}

function HubBatchForm() {
  const [result, setResult] = useState<ApiResult<{ batchId?: string }> | null>(null);
  const form = useForm<HubBatchFormInput, unknown, HubBatchInput>({
    resolver: zodResolver(hubBatchSchema),
    defaultValues: {
      capacityKg: 120,
      code: "",
      departureDate: "",
      destinationCity: "",
      destinationCountry: "",
      destinationHub: "",
      flightNumber: "",
      hubId: "",
      originHub: "",
      travelerId: "",
      tripId: "",
    },
  });

  async function onSubmit(values: HubBatchInput) {
    setResult(await submitJson<{ batchId?: string }>("/api/hub/batches", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Batch hub</h2>
      <Field label="Code batch" error={form.formState.errors.code?.message}>
        <Input placeholder="HUB-CDGDSS01" {...form.register("code")} />
      </Field>
      <Field label="Hub depart" error={form.formState.errors.originHub?.message}>
        <Input {...form.register("originHub")} />
      </Field>
      <Field label="Hub destination" error={form.formState.errors.destinationHub?.message}>
        <Input {...form.register("destinationHub")} />
      </Field>
      <Field label="ID hub operationnel" error={form.formState.errors.hubId?.message}>
        <Input placeholder="UUID hub aeroport" {...form.register("hubId")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Pays destination" error={form.formState.errors.destinationCountry?.message}>
          <Input placeholder="Senegal" {...form.register("destinationCountry")} />
        </Field>
        <Field label="Ville destination" error={form.formState.errors.destinationCity?.message}>
          <Input placeholder="Dakar" {...form.register("destinationCity")} />
        </Field>
      </div>
      <Field label="Vol" error={form.formState.errors.flightNumber?.message}>
        <Input {...form.register("flightNumber")} />
      </Field>
      <Field label="ID trajet voyageur" error={form.formState.errors.tripId?.message}>
        <Input {...form.register("tripId")} />
      </Field>
      <Field label="ID voyageur" error={form.formState.errors.travelerId?.message}>
        <Input {...form.register("travelerId")} />
      </Field>
      <Field label="Date depart" error={form.formState.errors.departureDate?.message}>
        <Input type="date" {...form.register("departureDate")} />
      </Field>
      <Field label="Capacite (kg)" error={form.formState.errors.capacityKg?.message}>
        <Input type="number" min="1" {...form.register("capacityKg")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Creer le batch</Button>
      {result?.ok && result.data?.batchId ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Batch ID : {result.data.batchId}
        </p>
      ) : null}
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

function HubBatchAssignmentForm() {
  const [result, setResult] = useState<ApiResult<{ reservationId?: string }> | null>(null);
  const form = useForm<
    HubBatchAssignmentFormInput,
    unknown,
    HubBatchAssignmentInput
  >({
    resolver: zodResolver(hubBatchAssignmentSchema),
    defaultValues: {
      batchId: "",
      reservedWeightKg: 1,
      shipmentId: "",
    },
  });

  async function onSubmit(values: HubBatchAssignmentInput) {
    setResult(await submitJson<{ reservationId?: string }>("/api/hub/assignments", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Reservation capacite</h2>
      <Field label="ID batch" error={form.formState.errors.batchId?.message}>
        <Input {...form.register("batchId")} />
      </Field>
      <Field label="ID expedition" error={form.formState.errors.shipmentId?.message}>
        <Input {...form.register("shipmentId")} />
      </Field>
      <Field label="Poids reserve (kg)" error={form.formState.errors.reservedWeightKg?.message}>
        <Input type="number" min="0.1" step="0.1" {...form.register("reservedWeightKg")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Reserver</Button>
      {result?.ok && result.data?.reservationId ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Reservation ID : {result.data.reservationId}
        </p>
      ) : null}
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

async function submitJson<T = unknown>(url: string, values: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  return (await response.json()) as ApiResult<T>;
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
