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
  relayPointSchema,
  relayScanSchema,
  type RelayPointFormInput,
  type RelayPointInput,
  type RelayScanFormInput,
  type RelayScanInput,
} from "@/lib/validation/relay";

export function RelayForms() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <RelayPointForm />
      <RelayScanForm />
    </div>
  );
}

function RelayPointForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<RelayPointFormInput, unknown, RelayPointInput>({
    resolver: zodResolver(relayPointSchema),
    defaultValues: {
      addressLine1: "",
      capacitySlots: 50,
      city: "",
      contactName: "",
      contactPhone: "",
      country: "",
      name: "",
      postalCode: "",
    },
  });

  async function onSubmit(values: RelayPointInput) {
    setResult(await submitJson("/api/relay/points", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Point relais</h2>
      <Field label="Nom" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} />
      </Field>
      <Field label="Contact" error={form.formState.errors.contactName?.message}>
        <Input {...form.register("contactName")} />
      </Field>
      <Field label="Telephone" error={form.formState.errors.contactPhone?.message}>
        <Input {...form.register("contactPhone")} />
      </Field>
      <Field label="Adresse" error={form.formState.errors.addressLine1?.message}>
        <Input {...form.register("addressLine1")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ville" error={form.formState.errors.city?.message}>
          <Input {...form.register("city")} />
        </Field>
        <Field label="Pays" error={form.formState.errors.country?.message}>
          <Input {...form.register("country")} />
        </Field>
        <Field label="Code postal" error={form.formState.errors.postalCode?.message}>
          <Input {...form.register("postalCode")} />
        </Field>
        <Field label="Capacite" error={form.formState.errors.capacitySlots?.message}>
          <Input type="number" min="1" {...form.register("capacitySlots")} />
        </Field>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>Creer le relais</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

function RelayScanForm() {
  const [result, setResult] = useState<ApiResult<{ scanId?: string }> | null>(null);
  const form = useForm<RelayScanFormInput, unknown, RelayScanInput>({
    resolver: zodResolver(relayScanSchema),
    defaultValues: {
      note: "",
      relayPointId: "",
      scanType: "check_in",
      trackingCode: "",
    },
  });

  async function onSubmit(values: RelayScanInput) {
    setResult(await submitJson<{ scanId?: string }>("/api/relay/scans", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Scan colis</h2>
      <Field label="Code de suivi" error={form.formState.errors.trackingCode?.message}>
        <Input placeholder="YBL-1234ABCD" {...form.register("trackingCode")} />
      </Field>
      <Field label="ID point relais" error={form.formState.errors.relayPointId?.message}>
        <Input {...form.register("relayPointId")} />
      </Field>
      <Field label="Type de scan" error={form.formState.errors.scanType?.message}>
        <select className="h-10 rounded-md border border-input bg-white px-3 text-sm" {...form.register("scanType")}>
          <option value="check_in">Entree relais</option>
          <option value="check_out">Sortie relais</option>
          <option value="handover">Remise</option>
          <option value="exception">Exception</option>
        </select>
      </Field>
      <Field label="Note" error={form.formState.errors.note?.message}>
        <Textarea {...form.register("note")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Enregistrer le scan</Button>
      {result?.ok && result.data?.scanId ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Scan ID : {result.data.scanId}
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
