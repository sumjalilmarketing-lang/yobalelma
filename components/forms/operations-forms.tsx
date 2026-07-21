"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  const shipments = useShipmentChoices();
  const form = useForm<PaymentIntentFormInput, unknown, PaymentIntentInput>({
    resolver: zodResolver(paymentIntentSchema),
    defaultValues: {
      shipmentId: "",
    },
  });

  async function onSubmit(values: PaymentIntentInput) {
    setResult(await submitJson<{ paymentIntentId?: string }>("/api/payments/intents", values));
  }

  return (
    <form className="grid gap-4 rounded-lg border border-black/10 p-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <h2 className="text-xl font-black">Préparer un paiement</h2>
      <Field label="Expédition" error={form.formState.errors.shipmentId?.message}>
        <Select {...form.register("shipmentId")}>
          <option value="">Choisir une expédition</option>
          {shipments.map((shipment) => (
            <option key={shipment.id} value={shipment.id}>
              {shipment.label} · {(shipment.amountCents / 100).toFixed(2)} {shipment.currency}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Préparer le paiement</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

export function SupportTicketForm() {
  const [result, setResult] = useState<ApiResult<{ ticketId?: string }> | null>(null);
  const shipments = useShipmentChoices();
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
      <Field label="Expédition concernée (facultatif)" error={form.formState.errors.shipmentId?.message}>
        <Select {...form.register("shipmentId")}>
          <option value="">Aucune expédition</option>
          {shipments.map((shipment) => (
            <option key={shipment.id} value={shipment.id}>{shipment.label}</option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Categorie" error={form.formState.errors.category?.message}>
          <Select {...form.register("category")}>
            <option value="shipment">Expedition</option>
            <option value="payment">Paiement</option>
            <option value="kyc">Vérification d’identité</option>
            <option value="damage">Dommage</option>
            <option value="delay">Retard</option>
            <option value="other">Autre</option>
          </Select>
        </Field>
        <Field label="Priorite" error={form.formState.errors.priority?.message}>
          <Select {...form.register("priority")}>
            <option value="low">Basse</option>
            <option value="normal">Normale</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </Select>
        </Field>
      </div>
      <Field label="Sujet" error={form.formState.errors.subject?.message}>
        <Input {...form.register("subject")} />
      </Field>
      <Field label="Message" error={form.formState.errors.message?.message}>
        <Textarea {...form.register("message")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Ouvrir le ticket</Button>
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
      <Field label="Référence de la demande" error={form.formState.errors.ticketId?.message}>
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

type ShipmentChoice = {
  amountCents: number;
  currency: string;
  id: string;
  label: string;
};

function useShipmentChoices() {
  const [shipments, setShipments] = useState<ShipmentChoice[]>([]);

  useEffect(() => {
    let active = true;

    void fetch("/api/shipments")
      .then((response) => response.json())
      .then((result: ApiResult<{ shipments?: ShipmentChoice[] }>) => {
        if (active && result.ok) {
          setShipments(result.data?.shipments ?? []);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return shipments;
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
