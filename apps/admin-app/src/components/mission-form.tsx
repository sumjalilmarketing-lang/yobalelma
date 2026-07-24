"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { governanceServices } from "../lib/governance-catalog";
import { defaultWorkflows, missionCreateSchema } from "../lib/workflow-engine";

type InputValues = z.input<typeof missionCreateSchema>;
type Values = z.output<typeof missionCreateSchema>;

export function MissionForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<InputValues, unknown, Values>({
    resolver: zodResolver(missionCreateSchema),
    defaultValues: { countryCode: "SN", priority: "normal", serviceId: "central_operations", workflowKey: "operations_standard" },
  });
  const submit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/admin/missions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json() as { message?: string };
    if (!response.ok) { setMessage(result.message || "La mission n’a pas pu être créée."); return; }
    setMessage("Mission créée et enregistrée dans le circuit de suivi."); reset(); router.refresh();
  });
  return <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-background p-5 shadow-line">
    <div><p className="text-xs font-black uppercase tracking-[.15em] text-primary">Nouvelle mission</p><h2 className="mt-1 text-2xl font-black">Créer et assigner</h2></div>
    <Field label="Intitulé" error={errors.title?.message}><input className={input} {...register("title")} placeholder="Contrôler le lot prioritaire" /></Field>
    <Field label="Description" error={errors.description?.message}><textarea className={`${input} min-h-24 py-3`} {...register("description")} placeholder="Résultat attendu, contraintes et points de contrôle" /></Field>
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Service" error={errors.serviceId?.message}><select className={input} {...register("serviceId")}>{governanceServices.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
      <Field label="Workflow" error={errors.workflowKey?.message}><select className={input} {...register("workflowKey")}>{defaultWorkflows.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Field>
      <Field label="Priorité" error={errors.priority?.message}><select className={input} {...register("priority")}><option value="low">Faible</option><option value="normal">Normale</option><option value="high">Haute</option><option value="critical">Critique</option></select></Field>
      <Field label="Pays" error={errors.countryCode?.message}><input className={input} {...register("countryCode")} maxLength={2} /></Field>
    </div>
    {message ? <p className="rounded-lg bg-accent p-3 text-sm font-bold">{message}</p> : null}
    <button disabled={isSubmitting} className="h-11 rounded-lg bg-primary px-5 font-black text-white disabled:opacity-50">{isSubmitting ? "Création…" : "Créer la mission"}</button>
  </form>;
}

const input = "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary";
function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) { return <label className="grid gap-1 text-sm font-bold">{label}{children}{error ? <span className="text-xs text-red-700">{error}</span> : null}</label>; }
