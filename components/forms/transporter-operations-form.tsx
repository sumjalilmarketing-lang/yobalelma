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
  transporterAvailabilitySchema,
  transporterProfileSchema,
  transporterVehicleSchema,
  transporterZoneSchema,
  type TransporterAvailabilityFormInput,
  type TransporterAvailabilityInput,
  type TransporterProfileFormInput,
  type TransporterProfileInput,
  type TransporterVehicleFormInput,
  type TransporterVehicleInput,
  type TransporterZoneFormInput,
  type TransporterZoneInput,
} from "@/lib/validation/transporter";

export function TransporterOperationsForm() {
  return (
    <div className="grid gap-8">
      <TransporterProfileSection />
      <div className="grid gap-8 lg:grid-cols-3">
        <VehicleSection />
        <ZoneSection />
        <AvailabilitySection />
      </div>
    </div>
  );
}

function TransporterProfileSection() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<TransporterProfileFormInput, unknown, TransporterProfileInput>({
    resolver: zodResolver(transporterProfileSchema),
    defaultValues: {
      baseCity: "",
      baseCountry: "",
      bio: "",
      businessName: "",
      maxWeightKg: 20,
    },
  });

  async function onSubmit(values: TransporterProfileInput) {
    setResult(await submitJson("/api/transporters/profile", "PUT", values));
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Profil transporteur local</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom public" error={form.formState.errors.businessName?.message}>
          <Input {...form.register("businessName")} />
        </Field>
        <Field label="Capacite max (kg)" error={form.formState.errors.maxWeightKg?.message}>
          <Input type="number" min="1" {...form.register("maxWeightKg")} />
        </Field>
        <Field label="Ville de base" error={form.formState.errors.baseCity?.message}>
          <Input {...form.register("baseCity")} />
        </Field>
        <Field label="Pays de base" error={form.formState.errors.baseCountry?.message}>
          <Input {...form.register("baseCountry")} />
        </Field>
      </div>
      <Field label="Presentation" error={form.formState.errors.bio?.message}>
        <Textarea {...form.register("bio")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Enregistrement..." : "Enregistrer le profil"}
      </Button>
      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />
    </form>
  );
}

function VehicleSection() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<TransporterVehicleFormInput, unknown, TransporterVehicleInput>({
    resolver: zodResolver(transporterVehicleSchema),
    defaultValues: {
      capacityKg: 20,
      label: "",
      plateNumber: "",
      type: "car",
    },
  });

  async function onSubmit(values: TransporterVehicleInput) {
    setResult(await submitJson("/api/transporters/vehicles", "POST", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-lg font-black">Vehicule</h2>
      <Field label="Type" error={form.formState.errors.type?.message}>
        <select className="h-10 rounded-md border border-input bg-white px-3 text-sm" {...form.register("type")}>
          <option value="bike">Velo</option>
          <option value="scooter">Scooter</option>
          <option value="car">Voiture</option>
          <option value="van">Fourgon</option>
          <option value="truck">Camion</option>
        </select>
      </Field>
      <Field label="Nom du vehicule" error={form.formState.errors.label?.message}>
        <Input {...form.register("label")} />
      </Field>
      <Field label="Immatriculation" error={form.formState.errors.plateNumber?.message}>
        <Input {...form.register("plateNumber")} />
      </Field>
      <Field label="Capacite (kg)" error={form.formState.errors.capacityKg?.message}>
        <Input type="number" min="1" {...form.register("capacityKg")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Ajouter</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

function ZoneSection() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<TransporterZoneFormInput, unknown, TransporterZoneInput>({
    resolver: zodResolver(transporterZoneSchema),
    defaultValues: { city: "", country: "", radiusKm: 20 },
  });

  async function onSubmit(values: TransporterZoneInput) {
    setResult(await submitJson("/api/transporters/zones", "POST", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-lg font-black">Zone</h2>
      <Field label="Ville" error={form.formState.errors.city?.message}>
        <Input {...form.register("city")} />
      </Field>
      <Field label="Pays" error={form.formState.errors.country?.message}>
        <Input {...form.register("country")} />
      </Field>
      <Field label="Rayon (km)" error={form.formState.errors.radiusKm?.message}>
        <Input type="number" min="1" {...form.register("radiusKm")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Ajouter</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

function AvailabilitySection() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<
    TransporterAvailabilityFormInput,
    unknown,
    TransporterAvailabilityInput
  >({
    resolver: zodResolver(transporterAvailabilitySchema),
    defaultValues: { availableOn: "", endsAt: "18:00", startsAt: "09:00" },
  });

  async function onSubmit(values: TransporterAvailabilityInput) {
    setResult(await submitJson("/api/transporters/availability", "POST", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-lg font-black">Disponibilite</h2>
      <Field label="Date" error={form.formState.errors.availableOn?.message}>
        <Input type="date" {...form.register("availableOn")} />
      </Field>
      <Field label="Debut" error={form.formState.errors.startsAt?.message}>
        <Input type="time" {...form.register("startsAt")} />
      </Field>
      <Field label="Fin" error={form.formState.errors.endsAt?.message}>
        <Input type="time" {...form.register("endsAt")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Ajouter</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

async function submitJson(url: string, method: "POST" | "PUT", values: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  return (await response.json()) as ApiResult;
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
