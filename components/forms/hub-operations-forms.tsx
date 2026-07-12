"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api/responses";

const manifestExample = JSON.stringify(
  [
    {
      trackingCode: "YBL-DEMO-001",
      status: "received_at_hub",
      note: "Reception conforme",
      photoPaths: [],
    },
  ],
  null,
  2,
);

export function HubInboundReceiptForm() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [itemsJson, setItemsJson] = useState(manifestExample);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setError(null);
    setResult(null);

    let items: unknown;

    try {
      items = JSON.parse(itemsJson);
    } catch {
      setError("Le JSON des colis est invalide.");
      return;
    }

    if (!Array.isArray(items)) {
      setError("Le manifeste doit etre un tableau de colis.");
      return;
    }

    setResult(
      await submitJson("/api/hub/inbound", {
        hubId: formData.get("hubId"),
        items,
        manifestId: formData.get("manifestId"),
        notes: formData.get("notes"),
      }),
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Reception manifeste"
        description="Scanne et confirme les colis attendus au hub. Les ecarts doivent etre justifies."
      />
      <Field label="ID hub">
        <Input name="hubId" required />
      </Field>
      <Field label="ID manifeste collecte">
        <Input name="manifestId" />
      </Field>
      <Field label="Colis scannes JSON">
        <Textarea value={itemsJson} onChange={(event) => setItemsJson(event.target.value)} rows={8} />
      </Field>
      <Field label="Note reception">
        <Textarea name="notes" />
      </Field>
      <Button type="submit">Confirmer la reception</Button>
      <FormMessage message={error ?? result?.message} tone={error || result?.ok === false ? "error" : result?.ok ? "success" : "info"} />
    </form>
  );
}

export function HubAdvancedInspectionForm() {
  const [result, setResult] = useState<ApiResult | null>(null);

  async function submit(formData: FormData) {
    setResult(
      await submitJson("/api/hub/advanced-inspections", {
        category: formData.get("category"),
        declaredContent: formData.get("declaredContent"),
        declaredWeightKg: formData.get("declaredWeightKg") || undefined,
        decision: formData.get("decision"),
        fragile: formData.get("fragile") === "true",
        hubId: formData.get("hubId"),
        measuredWeightKg: formData.get("measuredWeightKg"),
        note: formData.get("note"),
        packageCondition: formData.get("packageCondition"),
        packagingCompliant: formData.get("packagingCompliant") === "true",
        photoPaths: parsePaths(formData.get("photoPaths")),
        shipmentId: formData.get("shipmentId"),
      }),
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Inspection avancee"
        description="Controle poids, emballage, fragilite et decision operationnelle."
      />
      <Field label="ID hub">
        <Input name="hubId" required />
      </Field>
      <Field label="ID expedition">
        <Input name="shipmentId" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Poids declare">
          <Input name="declaredWeightKg" type="number" step="0.1" />
        </Field>
        <Field label="Poids mesure">
          <Input name="measuredWeightKg" type="number" step="0.1" required />
        </Field>
      </div>
      <Field label="Decision">
        <Select name="decision" defaultValue="approved" required>
          <option value="approved">Approuver</option>
          <option value="needs_repackaging">Reconditionner</option>
          <option value="needs_customer_confirmation">Confirmation client</option>
          <option value="blocked">Bloquer</option>
          <option value="rejected">Rejeter</option>
          <option value="quarantined">Quarantaine</option>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Emballage conforme">
          <Select name="packagingCompliant" defaultValue="true">
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </Select>
        </Field>
        <Field label="Fragile">
          <Select name="fragile" defaultValue="false">
            <option value="false">Non</option>
            <option value="true">Oui</option>
          </Select>
        </Field>
      </div>
      <Field label="Etat colis">
        <Input name="packageCondition" defaultValue="conforme" />
      </Field>
      <Field label="Contenu declare">
        <Input name="declaredContent" />
      </Field>
      <Field label="Categorie">
        <Input name="category" />
      </Field>
      <Field label="Photos Storage, separees par virgules">
        <Input name="photoPaths" />
      </Field>
      <Field label="Note inspection">
        <Textarea name="note" />
      </Field>
      <Button type="submit">Enregistrer inspection</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

export function HubStorageMoveForm() {
  const [result, setResult] = useState<ApiResult | null>(null);

  async function submit(formData: FormData) {
    setResult(
      await submitJson("/api/hub/storage", {
        hubId: formData.get("hubId"),
        measuredWeightKg: formData.get("measuredWeightKg") || undefined,
        note: formData.get("note"),
        shipmentId: formData.get("shipmentId"),
        status: formData.get("status"),
        toLocationId: formData.get("toLocationId"),
      }),
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Mouvement inventaire"
        description="Affecte ou deplace un colis vers un emplacement hub unique."
      />
      <Field label="ID hub">
        <Input name="hubId" required />
      </Field>
      <Field label="ID expedition">
        <Input name="shipmentId" required />
      </Field>
      <Field label="ID emplacement destination">
        <Input name="toLocationId" />
      </Field>
      <Field label="Statut stock">
        <Select name="status" defaultValue="in_storage">
          <option value="in_storage">En stock</option>
          <option value="inspection_required">Inspection requise</option>
          <option value="approved">Approuve</option>
          <option value="quarantined">Quarantaine</option>
          <option value="reserved_for_batch">Reserve lot</option>
          <option value="picked_for_batch">Prepare lot</option>
          <option value="damaged">Endommage</option>
          <option value="missing">Manquant</option>
        </Select>
      </Field>
      <Field label="Poids mesure">
        <Input name="measuredWeightKg" type="number" step="0.1" />
      </Field>
      <Field label="Note mouvement">
        <Textarea name="note" />
      </Field>
      <Button type="submit">Enregistrer mouvement</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

export function HubIncidentForm() {
  const [result, setResult] = useState<ApiResult | null>(null);

  async function submit(formData: FormData) {
    setResult(
      await submitJson("/api/hub/anomalies", {
        batchId: formData.get("batchId"),
        blocksPayout: formData.get("blocksPayout") === "true",
        description: formData.get("description"),
        hubId: formData.get("hubId"),
        incidentType: formData.get("incidentType"),
        priority: formData.get("priority"),
        shipmentId: formData.get("shipmentId"),
        title: formData.get("title"),
      }),
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Anomalie hub"
        description="Cree un incident operationnel, bloque si necessaire un colis, lot ou payout."
      />
      <Field label="Type">
        <Select name="incidentType" defaultValue="manifest_mismatch">
          <option value="missing_package">Colis manquant</option>
          <option value="extra_package">Colis supplementaire</option>
          <option value="damaged_package">Colis endommage</option>
          <option value="wrong_weight">Poids incoherent</option>
          <option value="wrong_dimensions">Dimensions incoherentes</option>
          <option value="prohibited_item">Article interdit</option>
          <option value="packaging_issue">Emballage non conforme</option>
          <option value="wrong_destination">Destination incoherente</option>
          <option value="capacity_mismatch">Capacite incoherente</option>
          <option value="qr_issue">Probleme QR</option>
          <option value="storage_issue">Probleme stockage</option>
          <option value="manifest_mismatch">Ecart manifeste</option>
          <option value="manual_review">Revue manuelle</option>
        </Select>
      </Field>
      <Field label="Titre">
        <Input name="title" required />
      </Field>
      <Field label="ID hub">
        <Input name="hubId" />
      </Field>
      <Field label="ID expedition">
        <Input name="shipmentId" />
      </Field>
      <Field label="ID lot">
        <Input name="batchId" />
      </Field>
      <Field label="Priorite">
        <Select name="priority" defaultValue="medium">
          <option value="low">Faible</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
          <option value="urgent">Urgente</option>
          <option value="critical">Critique</option>
        </Select>
      </Field>
      <Field label="Bloquer payout">
        <Select name="blocksPayout" defaultValue="false">
          <option value="false">Non</option>
          <option value="true">Oui</option>
        </Select>
      </Field>
      <Field label="Description">
        <Textarea name="description" />
      </Field>
      <Button type="submit">Creer anomalie</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

export function HubHandoverEventForm() {
  const [result, setResult] = useState<ApiResult | null>(null);

  async function submit(formData: FormData) {
    setResult(
      await submitJson("/api/hub/handover-events", {
        batchId: formData.get("batchId"),
        measuredWeightKg: formData.get("measuredWeightKg") || undefined,
        note: formData.get("note"),
        photoPaths: parsePaths(formData.get("photoPaths")),
        signaturePath: formData.get("signaturePath"),
        tokenId: formData.get("tokenId"),
        verifiedDocument: formData.get("verifiedDocument") === "true",
        verifiedIdentity: formData.get("verifiedIdentity") === "true",
        verifiedTicket: formData.get("verifiedTicket") === "true",
      }),
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <FormHeader
        title="Remise voyageur"
        description="Confirme identite, document, billet, poids et preuves avant remise."
      />
      <Field label="ID lot">
        <Input name="batchId" required />
      </Field>
      <Field label="ID token QR">
        <Input name="tokenId" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Identite">
          <Select name="verifiedIdentity" defaultValue="true">
            <option value="true">Verifiee</option>
            <option value="false">Non verifiee</option>
          </Select>
        </Field>
        <Field label="Document">
          <Select name="verifiedDocument" defaultValue="true">
            <option value="true">Verifie</option>
            <option value="false">Non verifie</option>
          </Select>
        </Field>
        <Field label="Billet">
          <Select name="verifiedTicket" defaultValue="true">
            <option value="true">Verifie</option>
            <option value="false">Non verifie</option>
          </Select>
        </Field>
      </div>
      <Field label="Poids remis">
        <Input name="measuredWeightKg" type="number" step="0.1" />
      </Field>
      <Field label="Signature Storage">
        <Input name="signaturePath" />
      </Field>
      <Field label="Photos Storage, separees par virgules">
        <Input name="photoPaths" />
      </Field>
      <Field label="Note remise">
        <Textarea name="note" />
      </Field>
      <Button type="submit">Confirmer remise</Button>
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}

async function submitJson<T = unknown>(url: string, values: unknown) {
  const response = await fetch(url, {
    body: JSON.stringify(values),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return (await response.json()) as ApiResult<T>;
}

function parsePaths(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);
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
