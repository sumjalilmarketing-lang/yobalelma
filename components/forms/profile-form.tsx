"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiResult } from "@/lib/api/responses";
import { profileSchema, type ProfileInput } from "@/lib/validation/profile";

export function ProfileForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      city: "",
      country: "",
      address: "",
      role: "client",
      preferredLanguage: "fr",
    },
  });

  async function onSubmit(values: ProfileInput) {
    setResult(null);
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setResult((await response.json()) as ApiResult);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom complet" error={form.formState.errors.fullName?.message}>
          <Input placeholder="Awa Diop" {...form.register("fullName")} />
        </Field>
        <Field label="Telephone" error={form.formState.errors.phone?.message}>
          <Input placeholder="+221..." {...form.register("phone")} />
        </Field>
        <Field label="Ville" error={form.formState.errors.city?.message}>
          <Input placeholder="Dakar" {...form.register("city")} />
        </Field>
        <Field label="Pays" error={form.formState.errors.country?.message}>
          <Input placeholder="Senegal" {...form.register("country")} />
        </Field>
        <Field label="Adresse" error={form.formState.errors.address?.message}>
          <Input placeholder="Rue, quartier, immeuble" {...form.register("address")} />
        </Field>
        <Field label="Role principal" error={form.formState.errors.role?.message}>
          <select
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            {...form.register("role")}
          >
            <option value="client">Client</option>
            <option value="local_transporter">Livreur local</option>
            <option value="traveler">Voyageur</option>
          </select>
        </Field>
        <Field
          label="Langue preferee"
          error={form.formState.errors.preferredLanguage?.message}
        >
          <select
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            {...form.register("preferredLanguage")}
          >
            <option value="fr">Francais</option>
            <option value="en">Anglais</option>
          </select>
        </Field>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Enregistrement..." : "Enregistrer mon profil"}
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
