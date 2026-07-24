"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { MissionStatus } from "../lib/workflow-engine";

const schema = z.object({
  action: z.enum(["assign", "reassign", "start", "submit", "request_correction", "validate", "close", "cancel"]),
  assigneeId: z.string().optional(), note: z.string().max(2000).optional(), proofReference: z.string().max(500).optional(),
});
type Values = z.infer<typeof schema>;
type Member = { id: string; name: string };

const actions: Record<MissionStatus, Values["action"][]> = {
  draft: ["assign", "cancel"], assigned: ["reassign", "start", "cancel"], in_progress: ["reassign", "submit", "cancel"],
  awaiting_validation: ["request_correction", "validate"], correction_required: ["reassign", "start", "submit"], validated: ["close"], closed: [], cancelled: [],
};
const labels: Record<Values["action"], string> = { assign: "Assigner", reassign: "Réassigner", start: "Démarrer l’exécution", submit: "Soumettre au contrôle", request_correction: "Demander une correction", validate: "Valider la mission", close: "Clôturer", cancel: "Annuler" };

export function MissionActions({ canManage, members, missionId, status }: { canManage: boolean; members: Member[]; missionId: string; status: MissionStatus }) {
  const router = useRouter(); const [message, setMessage] = useState<string | null>(null);
  const available = actions[status].filter((action) => canManage || !["assign", "reassign", "request_correction", "validate", "close", "cancel"].includes(action));
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { action: available[0], assigneeId: "", note: "", proofReference: "" } });
  const action = watch("action");
  if (!available.length) return <div className="rounded-xl border bg-muted p-5"><p className="font-black">Aucune action en attente</p><p className="mt-1 text-sm text-muted-foreground">La mission est terminée ou attend une décision d’un autre responsable.</p></div>;
  const submit = handleSubmit(async (values) => {
    setMessage(null);
    const body = { action: values.action, note: values.note || undefined, assigneeId: values.assigneeId || undefined, proofReference: values.proofReference || undefined, proofType: values.proofReference ? "activity_report" : undefined, proofIds: [] };
    const response = await fetch(`/api/admin/missions/${missionId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json() as { message?: string };
    setMessage(result.message || (response.ok ? "Décision enregistrée." : "La décision n’a pas pu être enregistrée."));
    if (response.ok) router.refresh();
  });
  return <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-background p-5 shadow-line"><div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">Prochaine décision</p><h2 className="mt-1 text-xl font-black">Faire avancer la mission</h2></div><label className="grid gap-1 text-sm font-bold">Action<select className={input} {...register("action")}>{available.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>{["assign", "reassign"].includes(action) ? <label className="grid gap-1 text-sm font-bold">Responsable<select className={input} {...register("assigneeId")}><option value="">Sélectionner</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label> : null}{action === "submit" ? <label className="grid gap-1 text-sm font-bold">Référence de la preuve obligatoire<input className={input} {...register("proofReference")} placeholder="Rapport, document ou référence de contrôle" /></label> : null}<label className="grid gap-1 text-sm font-bold">Note de décision<textarea className={`${input} min-h-24 py-3`} {...register("note")} placeholder="Décision, correction attendue ou observation" /></label>{message ? <p className="rounded-lg bg-accent p-3 text-sm font-bold">{message}</p> : null}<button disabled={isSubmitting} className="h-11 rounded-lg bg-primary px-5 font-black text-white disabled:opacity-50">{isSubmitting ? "Enregistrement…" : labels[action]}</button></form>;
}
const input = "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary";
