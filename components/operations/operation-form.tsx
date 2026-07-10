"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api/responses";

export type OperationField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "textarea" | "select" | "hidden";
  defaultValue?: string | number;
  options?: { label: string; value: string }[];
  required?: boolean;
};

export function OperationForm({
  title,
  description,
  endpoint,
  method = "POST",
  fields,
  submitLabel,
  children,
}: {
  title: string;
  description?: string;
  endpoint: string;
  method?: "POST" | "PATCH" | "PUT";
  fields: OperationField[];
  submitLabel: string;
  children?: ReactNode;
}) {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true);
    setResult(null);

    const payload = Object.fromEntries(
      [...formData.entries()].map(([key, value]) => [key, String(value)]),
    );

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setResult((await response.json()) as ApiResult);
    setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5">
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm font-medium leading-6 text-black/60">{description}</p>
        ) : null}
      </div>
      {fields.map((field) => (
        <Field key={field.name} field={field} />
      ))}
      {children}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Traitement..." : submitLabel}
      </Button>
      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />
    </form>
  );
}

function Field({ field }: { field: OperationField }) {
  if (field.type === "hidden") {
    return <input type="hidden" name={field.name} value={field.defaultValue ?? ""} />;
  }

  if (field.type === "textarea") {
    return (
      <label className="grid gap-2 text-sm font-semibold">
        {field.label}
        <Textarea
          name={field.name}
          defaultValue={field.defaultValue}
          required={field.required}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="grid gap-2 text-sm font-semibold">
        {field.label}
        <select
          className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          name={field.name}
          defaultValue={field.defaultValue}
          required={field.required}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="grid gap-2 text-sm font-semibold">
      {field.label}
      <Input
        name={field.name}
        type={field.type ?? "text"}
        defaultValue={field.defaultValue}
        required={field.required}
      />
    </label>
  );
}
