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
  paymentIntentSchema,
  supportMessageSchema,
  supportTicketSchema,
  type PaymentIntentFormInput,
  type PaymentIntentInput,
  type SupportMessageFormInput,
  type SupportMessageInput,
  type SupportTicketFormInput,
  type SupportTicketInput,
} from "@/lib/validation/operations";

export function PaymentIntentForm() {
  const [result, setResult] = useState<ApiResult<{ paymentIntentId?: string }> | null>(null);
  const form = useForm<PaymentIntentFormInput, unknown, PaymentIntentInput>({
    resolver: zodResolver(paymentIntentSchema),
    defaultValues: {
      amountCents: 1000,
      currency: "EUR",
      shipmentId: "",
    },
  });

  async function onSubmit(values: PaymentIntentInput) {
    setResult(await submitJson<{ paymentIntentId?: string }>("/api/payments/intents", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Paiement sandbox</h2>
      <Field label="ID expedition" error={form.formState.errors.shipmentId?.message}>
        <Input {...form.register("shipmentId")} />
      </Field>
      <Field label="Montant (centimes)" error={form.formState.errors.amountCents?.message}>
        <Input type="number" min="1" {...form.register("amountCents")} />
      </Field>
      <Field label="Devise" error={form.formState.errors.currency?.message}>
        <select className="h-10 rounded-md border border-input bg-white px-3 text-sm" {...form.register("currency")}>
          <option value="EUR">EUR</option>
          <option value="XOF">XOF</option>
          <option value="USD">USD</option>
        </select>
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Creer l&apos;intention</Button>
      {result?.ok && result.data?.paymentIntentId ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Payment intent ID : {result.data.paymentIntentId}
        </p>
      ) : null}
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

export function SupportTicketForm() {
  const [result, setResult] = useState<ApiResult<{ ticketId?: string }> | null>(null);
  const form = useForm<SupportTicketFormInput, unknown, SupportTicketInput>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      category: "shipment",
      message: "",
      priority: "normal",
      shipmentId: "",
      subject: "",
    },
  });

  async function onSubmit(values: SupportTicketInput) {
    setResult(await submitJson<{ ticketId?: string }>("/api/support/tickets", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Ticket support</h2>
      <Field label="ID expedition" error={form.formState.errors.shipmentId?.message}>
        <Input {...form.register("shipmentId")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Categorie" error={form.formState.errors.category?.message}>
          <select className="h-10 rounded-md border border-input bg-white px-3 text-sm" {...form.register("category")}>
            <option value="shipment">Expedition</option>
            <option value="payment">Paiement</option>
            <option value="kyc">KYC</option>
            <option value="damage">Dommage</option>
            <option value="delay">Retard</option>
            <option value="other">Autre</option>
          </select>
        </Field>
        <Field label="Priorite" error={form.formState.errors.priority?.message}>
          <select className="h-10 rounded-md border border-input bg-white px-3 text-sm" {...form.register("priority")}>
            <option value="low">Basse</option>
            <option value="normal">Normale</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </Field>
      </div>
      <Field label="Sujet" error={form.formState.errors.subject?.message}>
        <Input {...form.register("subject")} />
      </Field>
      <Field label="Message" error={form.formState.errors.message?.message}>
        <Textarea {...form.register("message")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Ouvrir le ticket</Button>
      {result?.ok && result.data?.ticketId ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Ticket ID : {result.data.ticketId}
        </p>
      ) : null}
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

export function SupportMessageForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const form = useForm<SupportMessageFormInput, unknown, SupportMessageInput>({
    resolver: zodResolver(supportMessageSchema),
    defaultValues: {
      message: "",
      ticketId: "",
    },
  });

  async function onSubmit(values: SupportMessageInput) {
    setResult(await submitJson("/api/support/messages", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Reponse support</h2>
      <Field label="ID ticket" error={form.formState.errors.ticketId?.message}>
        <Input {...form.register("ticketId")} />
      </Field>
      <Field label="Message" error={form.formState.errors.message?.message}>
        <Textarea {...form.register("message")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Ajouter la reponse</Button>
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
