"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function MfaEnrollPage() {
  const supabase = useMemo(createSupabaseBrowserClient, []);
  const [factor, setFactor] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const next = safeNext(typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next"));

  const enroll = async () => {
    setPending(true);
    setStatus("");
    const result = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Yobalelma Admin" });
    setPending(false);
    if (result.error) {
      setStatus("L’enrôlement n’a pas pu être initialisé. Utilisez la procédure de récupération.");
      return;
    }
    setFactor({ id: result.data.id, qrCode: result.data.totp.qr_code, secret: result.data.totp.secret });
  };

  const verify = async () => {
    if (!factor || !/^\d{6}$/u.test(code)) {
      setStatus("Saisissez un code valide à six chiffres.");
      return;
    }
    setPending(true);
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setPending(false);
    if (result.error) {
      setStatus("Le code est invalide ou expiré. Aucun accès sensible n’a été accordé.");
      return;
    }
    window.location.assign(next);
  };

  return <main className="grid min-h-screen place-items-center bg-background p-6">
    <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-xl">
      <Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={56} height={56} priority />
      <p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-primary">Enrôlement obligatoire</p>
      <h1 className="mt-2 text-3xl font-black">Protégez votre compte</h1>
      <p className="mt-3 text-sm text-muted-foreground">L’accès aux rôles sensibles exige un facteur TOTP AAL2. Enregistrez-le dans une application d’authentification avant de poursuivre.</p>
      {!factor ? <button className="mt-6 h-12 w-full rounded-xl bg-primary px-4 font-black text-primary-foreground disabled:opacity-60" disabled={pending} onClick={enroll} type="button">{pending ? "Préparation…" : "Créer mon facteur sécurisé"}</button> : <div className="mt-6 grid gap-4">
        <div className="grid justify-items-center rounded-xl bg-white p-4">
          <Image alt="QR d’enrôlement TOTP" height={220} src={factor.qrCode} unoptimized width={220} />
        </div>
        <p className="break-all rounded-lg bg-muted p-3 text-xs"><strong>Clé manuelle :</strong> {factor.secret}</p>
        <label className="grid gap-2 text-sm font-bold">Code de vérification
          <input className="h-12 rounded-xl border bg-background px-4 text-center text-xl font-black tracking-[.35em]" inputMode="numeric" maxLength={6} minLength={6} onChange={(event) => setCode(event.target.value)} pattern="[0-9]{6}" value={code} />
        </label>
        <button className="h-12 rounded-xl bg-primary px-4 font-black text-primary-foreground disabled:opacity-60" disabled={pending} onClick={verify} type="button">Activer et ouvrir le centre</button>
      </div>}
      {status ? <p className="mt-4 text-sm font-semibold text-destructive" role="alert">{status}</p> : null}
      <Link className="mt-5 block text-center text-sm font-bold text-primary underline" href="/auth/mfa/recovery">J’ai perdu mon appareil</Link>
    </section>
  </main>;
}

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/command";
}
