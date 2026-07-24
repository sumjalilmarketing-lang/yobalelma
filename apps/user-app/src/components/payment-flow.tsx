"use client";
import Link from "next/link";
import { CheckCircle2, Clock3, Phone, ShieldCheck, WalletCards, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PaymentState = "ready" | "submitting" | "pending" | "succeeded" | "failed";

export function PaymentFlow({ amount, currency, shipmentId }: { amount?: number; currency?: string; shipmentId?: string }) {
  const [state, setState] = useState<PaymentState>("ready");
  const [message, setMessage] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const idempotency = useRef(`payment:${crypto.randomUUID()}`);

  useEffect(() => {
    if (!paymentId || state !== "pending" || mode === "test") return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}/status`, { cache: "no-store" });
        const result = await response.json() as { data?: { status?: string }; message?: string };
        if (result.data?.status === "succeeded") { setState("succeeded"); setMessage("Paiement confirmé par Orange Money."); }
        if (["failed", "expired", "cancelled"].includes(result.data?.status || "")) { setState("failed"); setMessage(result.message || "Le paiement n’a pas été confirmé."); }
      } catch { setMessage("Connexion interrompue. La vérification reprendra automatiquement."); }
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [mode, paymentId, state]);

  if (!shipmentId || amount == null || !currency) return <section className="yb-empty"><div><WalletCards className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-4 text-xl font-black">Choisis une expédition à régler</h2><p className="mt-2 text-sm text-muted-foreground">Le montant est toujours calculé par Yobalelma avant l’ouverture du paiement.</p><Link className="yb-button yb-button-primary mt-5" href="/client/shipments">Voir mes expéditions</Link></div></section>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("submitting"); setMessage("");
    const phoneNumber = String(new FormData(event.currentTarget).get("phoneNumber") || "");
    try {
      const response = await fetch("/api/payments/intents", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotency.current }, body: JSON.stringify({ phoneNumber, shipmentId }) });
      const result = await response.json() as { data?: { mode?: string; paymentId?: string; status?: string }; message?: string };
      if (!response.ok || !result.data?.paymentId) { setState("failed"); setMessage(result.message || "Le paiement n’a pas pu être préparé."); return; }
      setPaymentId(result.data.paymentId); setMode(result.data.mode || null); setState(result.data.status === "succeeded" ? "succeeded" : "pending"); setMessage(result.message || "Validation en attente.");
    } catch { setState("pending"); setMessage("Connexion interrompue. Réessaie : la même demande ne sera pas débitée deux fois."); }
  }

  return <div className="grid gap-5 xl:grid-cols-[1fr_420px]"><section className="yb-panel"><p className="yb-eyebrow">Montant à régler</p><p className="mt-3 text-4xl font-black tracking-tight">{new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount / 100)}</p><p className="mt-2 text-sm text-muted-foreground">Expédition {shipmentId.slice(0, 8)}…</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><Step icon={WalletCards} label="Orange Money" /><Step icon={Phone} label="Validation mobile" /><Step icon={CheckCircle2} label="Confirmation réelle" /></div></section><section className="yb-panel"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-700"><WalletCards className="h-5 w-5" /></span><div><p className="text-xs font-black uppercase tracking-[.12em] text-primary">Paiement mobile</p><h2 className="text-xl font-black">Orange Money</h2></div></div>{mode === "test" ? <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-bold text-sky-950">Mode test — aucun débit réel et aucune transaction fournisseur.</p> : null}{state === "succeeded" ? <Receipt message={message} paymentId={paymentId} /> : <form className="mt-5 grid gap-4" onSubmit={submit}><label className="yb-label">Numéro Orange Money<input autoComplete="tel" className="yb-field" disabled={state === "submitting" || state === "pending"} inputMode="tel" name="phoneNumber" pattern="\+[1-9][0-9]{7,14}" placeholder="+221…" required type="tel" /></label><p className="text-sm leading-6 text-muted-foreground">Tu confirmeras l’opération depuis ton téléphone. Yobalelma attendra ensuite la confirmation du fournisseur.</p><button className="yb-button yb-button-primary" disabled={state === "submitting" || state === "pending"} type="submit">{state === "submitting" ? "Préparation…" : state === "pending" ? "Confirmation en attente…" : "Continuer avec Orange Money"}</button>{state === "pending" ? <div className="flex items-start gap-3 rounded-xl bg-muted p-3"><Clock3 className="mt-0.5 h-5 w-5 text-primary" /><p className="text-sm font-bold">Ne ferme pas cette page. Si tu la fermes, le statut restera disponible depuis ton suivi.</p></div> : null}{state === "failed" ? <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900"><WifiOff className="mt-0.5 h-5 w-5" /><p className="text-sm font-bold">{message}</p></div> : message ? <p aria-live="polite" className="text-sm font-bold">{message}</p> : null}</form>}</section></div>;
}

function Step({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) { return <div className="flex min-h-16 items-center gap-3 rounded-xl border bg-background p-3"><Icon className="h-5 w-5 text-primary" /><span className="text-sm font-black">{label}</span></div>; }
function Receipt({ message, paymentId }: { message: string; paymentId: string | null }) { return <div className="mt-6 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /><h3 className="mt-3 text-2xl font-black">Paiement confirmé</h3><p className="mt-2 text-sm text-muted-foreground">{message}</p><p className="mt-4 rounded-xl bg-muted p-3 font-mono text-xs">Reçu {paymentId}</p><Link className="yb-button yb-button-secondary mt-5" href="/client/tracking">Retour au suivi</Link></div>; }
