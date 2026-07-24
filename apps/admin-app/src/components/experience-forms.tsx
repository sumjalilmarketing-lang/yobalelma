"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { advertiserDraftSchema, countryExperienceDraftSchema } from "../lib/experience-schemas";

type CountryDraft = z.infer<typeof countryExperienceDraftSchema>;
type AdvertiserDraft = z.infer<typeof advertiserDraftSchema>;

export function CountryExperienceForm() {
  const [message, setMessage] = useState("");
  const { formState: { errors, isSubmitting }, handleSubmit, register, reset } = useForm<CountryDraft>({ resolver: zodResolver(countryExperienceDraftSchema), defaultValues: { countryCode: "SN", defaultLocale: "fr", availableLocales: ["fr"], currencyCode: "XOF", timeZone: "Africa/Dakar", unitSystem: "metric" } });
  const submit = handleSubmit(async (values) => {
    setMessage("");
    const response = await fetch("/api/admin/experience/countries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json() as { error?: string; version?: number };
    setMessage(response.ok ? `Version ${result.version} préparée pour validation.` : result.error || "La version n’a pas pu être préparée.");
    if (response.ok) reset(values);
  });
  return <form className="grid gap-3 rounded-xl border bg-muted/30 p-4" onSubmit={submit}><h3 className="font-black">Préparer une version pays</h3><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Field label="Pays"><input className={input} maxLength={2} {...register("countryCode")} /></Field><Field label="Langue par défaut"><input className={input} {...register("defaultLocale")} /></Field><Field label="Langues disponibles"><input className={input} defaultValue="fr" onChange={(event) => register("availableLocales").onChange({ target: { name: "availableLocales", value: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })} /></Field><Field label="Devise"><input className={input} maxLength={3} {...register("currencyCode")} /></Field><Field label="Fuseau horaire"><input className={input} {...register("timeZone")} /></Field><Field label="Unités"><select className={input} {...register("unitSystem")}><option value="metric">Métriques</option><option value="imperial">Impériales</option></select></Field></div>{Object.keys(errors).length ? <p className="text-sm font-bold text-error">Vérifiez les champs indiqués.</p> : null}{message ? <p role="status" className="text-sm font-bold text-primary">{message}</p> : null}<button disabled={isSubmitting} className="h-10 justify-self-start rounded-lg bg-primary px-4 text-sm font-black text-white disabled:opacity-60">{isSubmitting ? "Préparation…" : "Préparer la version"}</button></form>;
}

export function AdvertiserForm() {
  const [message, setMessage] = useState("");
  const { formState: { errors, isSubmitting }, handleSubmit, register, reset, setValue } = useForm<AdvertiserDraft>({ resolver: zodResolver(advertiserDraftSchema), defaultValues: { legalName: "", displayName: "", billingCountry: "SN", allowedDomains: [] } });
  const submit = handleSubmit(async (values) => {
    setMessage("");
    const response = await fetch("/api/admin/monetization/advertisers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Annonceur enregistré en brouillon." : result.error || "L’annonceur n’a pas pu être enregistré.");
    if (response.ok) reset();
  });
  return <form className="grid gap-3 rounded-xl border bg-muted/30 p-4" onSubmit={submit}><h3 className="font-black">Enregistrer un annonceur</h3><div className="grid gap-3 md:grid-cols-2"><Field label="Raison sociale"><input className={input} {...register("legalName")} /></Field><Field label="Nom affiché"><input className={input} {...register("displayName")} /></Field><Field label="Pays de facturation"><input className={input} maxLength={2} {...register("billingCountry")} /></Field><Field label="Domaines autorisés"><input className={input} placeholder="partenaire.example" onChange={(event) => setValue("allowedDomains", event.target.value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean), { shouldValidate: true })} /></Field></div>{Object.keys(errors).length ? <p className="text-sm font-bold text-error">Vérifiez les informations de l’annonceur.</p> : null}{message ? <p role="status" className="text-sm font-bold text-primary">{message}</p> : null}<button disabled={isSubmitting} className="h-10 justify-self-start rounded-lg bg-primary px-4 text-sm font-black text-white disabled:opacity-60">{isSubmitting ? "Enregistrement…" : "Enregistrer en brouillon"}</button></form>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) { return <label className="grid gap-1 text-sm font-black"><span>{label}</span>{children}</label>; }
const input = "h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary";
