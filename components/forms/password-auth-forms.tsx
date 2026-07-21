"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ApiResult } from "@/lib/api/responses";
import { getSafeAuthRedirect } from "@/lib/auth/redirect";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/auth";

type ApiWithNext = ApiResult<{ next?: string }>;

export function PasswordSignInForm() {
  const router = useRouter();
  const [result, setResult] = useState<ApiWithNext | null>(null);
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    setResult(null);
    const response = await fetch("/api/auth/password-sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiWithNext;
    setResult(payload);

    if (payload.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(getSafeAuthRedirect(next, payload.data?.next ?? "/dashboard"));
    }
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Mot de passe" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...form.register("password")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Connexion..." : "Se connecter"}
      </Button>
      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />
    </form>
  );
}

export function SignUpForm() {
  const [result, setResult] = useState<ApiWithNext | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      country: "",
      city: "",
      address: "",
      role: "client",
    },
  });

  async function onSubmit(values: SignUpInput) {
    setResult(null);
    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setResult((await response.json()) as ApiWithNext);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom complet" error={form.formState.errors.fullName?.message}>
          <Input autoComplete="name" {...form.register("fullName")} />
        </Field>
        <Field label="Telephone" error={form.formState.errors.phone?.message}>
          <Input autoComplete="tel" {...form.register("phone")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Role souhaite" error={form.formState.errors.role?.message}>
          <Select {...form.register("role")}>
            <option value="client">Je veux envoyer un colis</option>
            <option value="local_transporter">Je veux devenir livreur</option>
            <option value="traveler">Je veux voyager avec Yobalelma</option>
          </Select>
        </Field>
        <Field label="Pays" error={form.formState.errors.country?.message}>
          <Input autoComplete="country-name" {...form.register("country")} />
        </Field>
        <Field label="Ville" error={form.formState.errors.city?.message}>
          <Input autoComplete="address-level2" {...form.register("city")} />
        </Field>
      </div>
      <Field label="Adresse" error={form.formState.errors.address?.message}>
        <Input autoComplete="street-address" {...form.register("address")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Mot de passe" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field
          label="Confirmer le mot de passe"
          error={form.formState.errors.confirmPassword?.message}
        >
          <Input
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
        </Field>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creation..." : "Creer mon compte"}
      </Button>
      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setResult(null);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setResult((await response.json()) as ApiResult);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Envoi..." : "Envoyer le lien"}
      </Button>
      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />
    </form>
  );
}

export function ResetPasswordForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setResult(null);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setResult((await response.json()) as ApiResult);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="Nouveau mot de passe" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field
        label="Confirmer le mot de passe"
        error={form.formState.errors.confirmPassword?.message}
      >
        <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Mise a jour..." : "Mettre a jour"}
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
