"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiResult } from "@/lib/api/responses";
import {
  identityVerificationSchema,
  type IdentityVerificationInput,
} from "@/lib/validation/profile";

export function KycForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<IdentityVerificationInput>({
    resolver: zodResolver(identityVerificationSchema),
    defaultValues: {
      documentType: "national_id",
      documentNumber: "",
      issuingCountry: "",
      expiresOn: "",
      frontFilePath: "",
      backFilePath: "",
      selfieFilePath: "",
      passportFilePath: "",
    },
  });

  async function onSubmit(values: IdentityVerificationInput) {
    setResult(null);
    const response = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setResult((await response.json()) as ApiResult);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Type de document" error={form.formState.errors.documentType?.message}>
          <select
            className="h-10 rounded-md border border-input px-3 text-sm"
            {...form.register("documentType")}
          >
            <option value="national_id">Piece d&apos;identite</option>
            <option value="passport">Passeport</option>
            <option value="residence_permit">Titre de sejour</option>
            <option value="driver_license">Permis de conduire</option>
          </select>
        </Field>
        <Field label="Numero du document" error={form.formState.errors.documentNumber?.message}>
          <Input {...form.register("documentNumber")} />
        </Field>
        <Field label="Pays emetteur" error={form.formState.errors.issuingCountry?.message}>
          <Input {...form.register("issuingCountry")} />
        </Field>
        <Field label="Date d&apos;expiration" error={form.formState.errors.expiresOn?.message}>
          <Input type="date" {...form.register("expiresOn")} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Chemin fichier recto" error={form.formState.errors.frontFilePath?.message}>
          <Input placeholder="kyc/user/document-front.jpg" {...form.register("frontFilePath")} />
        </Field>
        <Field label="Chemin fichier verso" error={form.formState.errors.backFilePath?.message}>
          <Input placeholder="kyc/user/document-back.jpg" {...form.register("backFilePath")} />
        </Field>
        <Field label="Chemin selfie" error={form.formState.errors.selfieFilePath?.message}>
          <Input placeholder="kyc/user/selfie.jpg" {...form.register("selfieFilePath")} />
        </Field>
        <Field label="Chemin passeport" error={form.formState.errors.passportFilePath?.message}>
          <Input placeholder="kyc/user/passport.jpg" {...form.register("passportFilePath")} />
        </Field>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Soumission..." : "Soumettre le KYC"}
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

