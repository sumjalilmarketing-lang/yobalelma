"use client";

import { useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api/responses";

type Result = ApiResult<Record<string, unknown>>;

async function postAction(endpoint: string, payload: Record<string, unknown>, method = "POST") {
  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method,
  });

  return (await response.json()) as Result;
}

function useActionState() {
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return { result, setResult, submitting, setSubmitting };
}

export function DestinationReceptionForm() {
  const state = useActionState();

  async function submit(formData: FormData) {
    state.setSubmitting(true);
    state.setResult(null);
    state.setResult(
      await postAction("/api/final-delivery/destination-reception", {
        batchId: formData.get("batchId"),
        defaultDeliveryMode: formData.get("defaultDeliveryMode"),
        note: formData.get("note"),
        relayPointId: formData.get("relayPointId"),
      }),
    );
    state.setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Receptionner un lot destination"
        description="Confirme le lot, cree l'inventaire destination, initialise le choix de remise et journalise les notifications."
      />
      <Field name="batchId" label="ID du lot" required />
      <Field name="relayPointId" label="ID point relais destination" />
      <label className="grid gap-2 text-sm font-semibold">
        Mode par defaut
        <Select name="defaultDeliveryMode" defaultValue="relay_pickup">
          <option value="relay_pickup">Retrait au point relais</option>
          <option value="home_delivery">Livraison finale a domicile</option>
        </Select>
      </label>
      <TextAreaField name="note" label="Note de reception" />
      <SubmitButton submitting={state.submitting} label="Receptionner le lot" />
      <ResultMessage result={state.result} />
    </form>
  );
}

export function DeliveryChoiceForm({ shipmentId }: { shipmentId?: string }) {
  const state = useActionState();

  async function submit(formData: FormData) {
    state.setSubmitting(true);
    state.setResult(null);
    state.setResult(
      await postAction("/api/final-delivery/choice", {
        deliveryMode: formData.get("deliveryMode"),
        reason: formData.get("reason"),
        shipmentId: formData.get("shipmentId"),
      }),
    );
    state.setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Choisir le mode de remise"
        description="Le changement est audite et met a jour l'etape finale sans clore l'expedition."
      />
      <Field name="shipmentId" label="ID expedition" defaultValue={shipmentId} required />
      <label className="grid gap-2 text-sm font-semibold">
        Mode
        <Select name="deliveryMode" defaultValue="relay_pickup">
          <option value="relay_pickup">Retrait relais</option>
          <option value="home_delivery">Livraison domicile</option>
        </Select>
      </label>
      <TextAreaField name="reason" label="Motif ou source du choix" />
      <SubmitButton submitting={state.submitting} label="Enregistrer le choix" />
      <ResultMessage result={state.result} />
    </form>
  );
}

export function DeliveryOtpPanel({
  deliveryMode = "relay_pickup",
  shipmentId,
}: {
  deliveryMode?: "relay_pickup" | "home_delivery";
  shipmentId?: string;
}) {
  const generate = useActionState();
  const verify = useActionState();

  async function submitGenerate(formData: FormData) {
    generate.setSubmitting(true);
    generate.setResult(null);
    generate.setResult(
      await postAction("/api/final-delivery/otp", {
        channel: formData.get("channel"),
        deliveryMode: formData.get("deliveryMode"),
        shipmentId: formData.get("shipmentId"),
        ttlMinutes: formData.get("ttlMinutes"),
      }),
    );
    generate.setSubmitting(false);
  }

  async function submitVerify(formData: FormData) {
    verify.setSubmitting(true);
    verify.setResult(null);
    verify.setResult(
      await postAction(
        "/api/final-delivery/otp",
        {
          deliveryMode: formData.get("deliveryMode"),
          missionId: formData.get("missionId"),
          note: formData.get("note"),
          otpCode: formData.get("otpCode"),
          photoPath: formData.get("photoPath"),
          recipientName: formData.get("recipientName"),
          recipientPhoneLast4: formData.get("recipientPhoneLast4"),
          shipmentId: formData.get("shipmentId"),
          signaturePath: formData.get("signaturePath"),
        },
        "PATCH",
      ),
    );
    verify.setSubmitting(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={submitGenerate} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
        <FormHeader
          title="Generer / renvoyer un OTP"
          description="Un nouveau code annule automatiquement le precedent et reste limite dans le temps."
        />
        <Field name="shipmentId" label="ID expedition" defaultValue={shipmentId} required />
        <DeliveryModeSelect defaultValue={deliveryMode} />
        <Field name="ttlMinutes" label="Duree de vie minutes" type="number" defaultValue="15" required />
        <label className="grid gap-2 text-sm font-semibold">
          Canal
          <Select name="channel" defaultValue="in_app">
            <option value="in_app">In-app</option>
            <option value="email">Email sandbox</option>
            <option value="sms">SMS sandbox</option>
            <option value="whatsapp">WhatsApp sandbox</option>
          </Select>
        </label>
        <SubmitButton submitting={generate.submitting} label="Generer l'OTP" />
        <ResultMessage result={generate.result} />
        {generate.result?.ok && generate.result.data?.otpCodeForTestOnly ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">
            Code temporaire: {String(generate.result.data.otpCodeForTestOnly)}
          </p>
        ) : null}
      </form>

      <form action={submitVerify} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
        <FormHeader
          title="Verifier l'OTP et remettre"
          description="Une validation reussie cree la preuve, ferme l'expedition et declenche les payouts eligibles."
        />
        <Field name="shipmentId" label="ID expedition" defaultValue={shipmentId} required />
        <DeliveryModeSelect defaultValue={deliveryMode} />
        <Field name="otpCode" label="OTP 6 chiffres" required />
        <Field name="missionId" label="ID mission finale si domicile" />
        <Field name="recipientName" label="Nom confirme" />
        <Field name="recipientPhoneLast4" label="4 derniers chiffres telephone" />
        <Field name="signaturePath" label="Chemin signature privee" />
        <Field name="photoPath" label="Chemin photo autorisee" />
        <TextAreaField name="note" label="Note de remise" />
        <SubmitButton submitting={verify.submitting} label="Verifier et livrer" />
        <ResultMessage result={verify.result} />
      </form>
    </div>
  );
}

export function FinalMileMissionForm({ shipmentId }: { shipmentId?: string }) {
  const state = useActionState();

  async function submit(formData: FormData) {
    state.setSubmitting(true);
    state.setResult(null);
    state.setResult(
      await postAction("/api/final-delivery/final-mile", {
        note: formData.get("note"),
        shipmentId: formData.get("shipmentId"),
        transporterId: formData.get("transporterId"),
      }),
    );
    state.setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
        <FormHeader
          title="Creer une mission finale"
          description="Selectionne un livreur disponible ou laisse Yobalelma proposer le meilleur profil actif."
      />
      <Field name="shipmentId" label="ID expedition" defaultValue={shipmentId} required />
      <Field name="transporterId" label="ID livreur optionnel" />
      <TextAreaField name="note" label="Instructions livreur" />
      <SubmitButton submitting={state.submitting} label="Creer la mission" />
      <ResultMessage result={state.result} />
    </form>
  );
}

export function FinalDeliveryAttemptForm({ shipmentId }: { shipmentId?: string }) {
  const state = useActionState();

  async function submit(formData: FormData) {
    state.setSubmitting(true);
    state.setResult(null);
    state.setResult(
      await postAction("/api/final-delivery/attempts", {
        note: formData.get("note"),
        rescheduledFor: formData.get("rescheduledFor"),
        shipmentId: formData.get("shipmentId"),
        status: formData.get("status"),
      }),
    );
    state.setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
        <FormHeader
          title="Journaliser un echec ou une reprise"
          description="Chaque tentative garde une trace claire et preserve la remise finale tant qu'elle n'est pas confirmee."
      />
      <Field name="shipmentId" label="ID expedition" defaultValue={shipmentId} required />
      <label className="grid gap-2 text-sm font-semibold">
        Statut
        <Select name="status" defaultValue="delivery_attempted">
          <option value="delivery_attempted">Tentative effectuee</option>
          <option value="recipient_absent">Destinataire absent</option>
          <option value="invalid_address">Adresse invalide</option>
          <option value="delivery_rescheduled">Reprogramme</option>
          <option value="returned_to_relay">Retour relais</option>
          <option value="refused_by_recipient">Refuse</option>
          <option value="delivery_blocked">Bloque</option>
          <option value="return_requested">Retour demande</option>
        </Select>
      </label>
      <Field name="rescheduledFor" label="Reprogramme pour ISO" />
      <TextAreaField name="note" label="Note obligatoire" required />
      <SubmitButton submitting={state.submitting} label="Journaliser" />
      <ResultMessage result={state.result} />
    </form>
  );
}

export function AdminOverrideForm({ shipmentId }: { shipmentId?: string }) {
  const state = useActionState();

  async function submit(formData: FormData) {
    state.setSubmitting(true);
    state.setResult(null);
    state.setResult(
      await postAction("/api/admin/delivery-overrides", {
        comment: formData.get("comment"),
        forceDelivered: formData.get("forceDelivered") === "on",
        newStatus: formData.get("newStatus"),
        reason: formData.get("reason"),
        shipmentId: formData.get("shipmentId"),
      }),
    );
    state.setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
        <FormHeader
        title="Correction admin"
        description="Action sensible: le motif, le commentaire, le statut et la preuve alternative sont conserves."
      />
      <Field name="shipmentId" label="ID expedition" defaultValue={shipmentId} required />
      <label className="grid gap-2 text-sm font-semibold">
        Nouveau statut
        <Select name="newStatus" defaultValue="delivered">
          <option value="delivered">Livre manuellement</option>
          <option value="delivery_blocked">Bloque</option>
          <option value="disputed">Litige</option>
          <option value="return_requested">Retour demande</option>
        </Select>
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input name="forceDelivered" type="checkbox" className="h-4 w-4 accent-primary" />
        Marquer livre avec preuve alternative
      </label>
      <TextAreaField name="reason" label="Motif" required />
      <TextAreaField name="comment" label="Commentaire" required />
      <SubmitButton submitting={state.submitting} label="Executer l'override" />
      <ResultMessage result={state.result} />
    </form>
  );
}

function FormHeader({ description, title }: { description: string; title: string }) {
  return (
    <div>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-1 text-sm font-medium leading-6 text-black/60">{description}</p>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <Input name={name} required={required} type={type} defaultValue={defaultValue} />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <Textarea name={name} required={required} rows={3} />
    </label>
  );
}

function DeliveryModeSelect({
  defaultValue,
}: {
  defaultValue: "relay_pickup" | "home_delivery";
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      Mode de remise
      <Select name="deliveryMode" defaultValue={defaultValue}>
        <option value="relay_pickup">Retrait relais</option>
        <option value="home_delivery">Livraison domicile</option>
      </Select>
    </label>
  );
}

function SubmitButton({ label, submitting }: { label: string; submitting: boolean }) {
  return (
    <Button type="submit" disabled={submitting}>
      {submitting ? "Traitement..." : label}
    </Button>
  );
}

function ResultMessage({ result }: { result: Result | null }) {
  return (
    <FormMessage
      message={result?.message}
      tone={result ? (result.ok ? "success" : "error") : "info"}
    />
  );
}
