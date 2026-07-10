"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiResult } from "@/lib/api/responses";
import { emailAuthSchema, type EmailAuthInput } from "@/lib/validation/auth";

export function AuthForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<EmailAuthInput>({
    resolver: zodResolver(emailAuthSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: EmailAuthInput) {
    setResult(null);
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiResult;
    setResult(payload);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <Input type="email" placeholder="toi@example.com" {...form.register("email")} />
        {form.formState.errors.email ? (
          <span className="text-sm text-red-700">{form.formState.errors.email.message}</span>
        ) : null}
      </label>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Envoi..." : "Recevoir le lien magique"}
      </Button>
      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />
    </form>
  );
}
