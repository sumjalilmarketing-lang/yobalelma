"use client";
import { useState } from "react";

export function RefundRequestForm({ payments }: { payments: { amount: number; currency: string; id: string; reference: string }[] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/finance/refunds", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": `refund:${crypto.randomUUID()}` }, body: JSON.stringify({ paymentId: form.get("paymentId"), amount: Math.round(Number(form.get("amount")) * 100), reason: form.get("reason") }) });
      const result = await response.json() as { error?: string; message?: string };
      setMessage(response.ok ? result.message || "Demande enregistrée." : result.error || "Demande refusée.");
      if (response.ok) event.currentTarget.reset();
    } catch { setMessage("La connexion a été interrompue. Aucun remboursement n’a été exécuté."); }
    finally { setPending(false); }
  }
  return <form className="mt-5 grid gap-3" onSubmit={submit}><label className="yb-label">Paiement<select className="yb-field" name="paymentId" required><option value="">Sélectionner</option>{payments.map((payment) => <option key={payment.id} value={payment.id}>{payment.reference} · {(payment.amount / 100).toFixed(2)} {payment.currency}</option>)}</select></label><label className="yb-label">Montant<input className="yb-field" min="0.01" name="amount" required step="0.01" type="number" /></label><label className="yb-label">Motif<textarea className="yb-field min-h-24" minLength={3} name="reason" required /></label><button className="yb-button yb-button-secondary" disabled={pending || !payments.length} type="submit">{pending ? "Enregistrement…" : "Soumettre à autorisation"}</button>{message ? <p aria-live="polite" className="text-sm font-bold">{message}</p> : null}</form>;
}
