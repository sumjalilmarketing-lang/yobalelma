"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api/responses";

export function CollectionWorkflowForms() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <CollectionRouteForm />
      <CollectionStopForm />
      <CollectionManifestForm />
      <CollectionManifestItemForm />
    </div>
  );
}

function CollectionRouteForm() {
  return (
    <JsonOperationForm
      endpoint="/api/collection/routes"
      fields={[
        { label: "Nom tournee", name: "name", required: true },
        { label: "Date tournee", name: "routeDate", required: true, type: "date" },
        { label: "ID chauffeur collecte", name: "driverId" },
      ]}
      successKey="routeId"
      submitLabel="Creer la tournee"
      title="Tournee collecte"
      description="Planifie la collecte relais vers hub. Le chauffeur peut etre ajoute plus tard."
    />
  );
}

function CollectionStopForm() {
  const [result, setResult] = useState<ApiResult<{ stopId?: string }> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    const routeId = String(formData.get("routeId") ?? "").trim();
    setSubmitting(true);
    setResult(null);

    const response = await fetch(`/api/collection/routes/${routeId}`, {
      body: JSON.stringify({
        relayPointId: formData.get("relayPointId"),
        stopOrder: formData.get("stopOrder"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setResult((await response.json()) as ApiResult<{ stopId?: string }>);
    setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Arret relais"
        description="Ajoute un point relais a une tournee existante."
      />
      <Field label="ID tournee">
        <Input name="routeId" required />
      </Field>
      <Field label="ID point relais">
        <Input name="relayPointId" required />
      </Field>
      <Field label="Ordre arret">
        <Input name="stopOrder" type="number" min="1" defaultValue="1" required />
      </Field>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Ajout..." : "Ajouter l'arret"}
      </Button>
      {result?.ok && result.data?.stopId ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Arret ID : {result.data.stopId}
        </p>
      ) : null}
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

function CollectionManifestForm() {
  return (
    <JsonOperationForm
      endpoint="/api/collection/manifests"
      fields={[
        { label: "ID tournee", name: "routeId", required: true },
        { label: "Code manifeste", name: "code", placeholder: "MAN-ABCD1234", required: true },
        { label: "Mode", name: "mode", type: "hidden", value: "manifest" },
      ]}
      successKey="manifestId"
      submitLabel="Creer et sceller"
      title="Manifeste collecte"
      description="Cree un manifeste scelle avant depart vers le hub."
    />
  );
}

function CollectionManifestItemForm() {
  return (
    <JsonOperationForm
      endpoint="/api/collection/manifests"
      fields={[
        { label: "ID manifeste", name: "manifestId", required: true },
        { label: "ID expedition", name: "shipmentId", required: true },
        { label: "Note incident", name: "incidentNote", type: "textarea" },
        { label: "Mode", name: "mode", type: "hidden", value: "item" },
      ]}
      successKey="itemId"
      submitLabel="Ajouter au manifeste"
      title="Colis collecte"
      description="Ajoute un colis au manifeste et passe l'expedition en collecte vers hub."
    />
  );
}

function JsonOperationForm({
  description,
  endpoint,
  fields,
  submitLabel,
  successKey,
  title,
}: {
  description: string;
  endpoint: string;
  fields: Array<{
    label: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    type?: "date" | "hidden" | "number" | "textarea" | "text";
    value?: string;
  }>;
  submitLabel: string;
  successKey: string;
  title: string;
}) {
  const [result, setResult] = useState<ApiResult<Record<string, string>> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true);
    setResult(null);

    const payload = Object.fromEntries(
      [...formData.entries()].map(([key, value]) => [key, String(value)]),
    );

    const response = await fetch(endpoint, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setResult((await response.json()) as ApiResult<Record<string, string>>);
    setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader title={title} description={description} />
      {fields.map((field) =>
        field.type === "hidden" ? (
          <input key={field.name} name={field.name} type="hidden" value={field.value ?? ""} />
        ) : (
          <Field key={field.name} label={field.label}>
            {field.type === "textarea" ? (
              <Textarea name={field.name} placeholder={field.placeholder} required={field.required} />
            ) : (
              <Input
                name={field.name}
                type={field.type ?? "text"}
                defaultValue={field.value}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </Field>
        ),
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Traitement..." : submitLabel}
      </Button>
      {result?.ok && result.data?.[successKey] ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          ID : {result.data[successKey]}
        </p>
      ) : null}
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

function FormHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-1 text-sm font-medium leading-6 text-black/60">{description}</p>
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}
