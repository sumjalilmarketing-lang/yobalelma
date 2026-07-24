import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSession } from "./types";

export const financeRoles = ["super_admin", "admin", "finance_manager", "finance_agent", "accounting_agent", "reconciliation_agent", "payment_agent", "commission_agent", "refund_agent", "auditor"];
export function canAccessFinance(session: AdminSession) { return session.roleIds.some((role) => financeRoles.includes(role)); }

export type FinanceFilters = { country?: string; currency?: string; from?: string; query?: string; status?: string; to?: string };

export async function loadFinanceData(session: AdminSession, filters: FinanceFilters = {}) {
  if (!canAccessFinance(session)) return null;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return { events: [], payments: [], payouts: [], refunds: [], sourceReady: false };
  const db = supabase as SupabaseClient;
  let paymentsQuery = db.from("payments").select("id, shipment_id, customer_id, provider, provider_transaction_id, internal_reference, amount, currency, status, country_code, initiated_at, confirmed_at, failure_code, created_at, updated_at").order("created_at", { ascending: false }).limit(250);
  if (filters.status) paymentsQuery = paymentsQuery.eq("status", filters.status);
  if (filters.country) paymentsQuery = paymentsQuery.eq("country_code", filters.country.toUpperCase());
  if (filters.currency) paymentsQuery = paymentsQuery.eq("currency", filters.currency.toUpperCase());
  if (filters.from) paymentsQuery = paymentsQuery.gte("created_at", `${filters.from}T00:00:00Z`);
  if (filters.to) paymentsQuery = paymentsQuery.lte("created_at", `${filters.to}T23:59:59Z`);
  if (filters.query) {
    const query = filters.query.replace(/[^a-zA-Z0-9_-]/gu, "").slice(0, 80);
    const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/iu.test(query);
    if (query) paymentsQuery = paymentsQuery.or(`internal_reference.ilike.%${query}%,provider_transaction_id.ilike.%${query}%${uuid ? `,shipment_id.eq.${query},customer_id.eq.${query}` : ""}`);
  }
  const [paymentsResult, eventsResult, refundsResult, payoutsResult] = await Promise.all([
    paymentsQuery,
    db.from("payment_events").select("id, payment_id, event_type, provider_event_id, verified, received_at, processed_at, processing_status, failure_reason").order("received_at", { ascending: false }).limit(200),
    db.from("refunds").select("id, payment_id, amount, reason, provider_refund_id, status, created_by, approved_by, created_at").order("created_at", { ascending: false }).limit(150),
    db.from("payouts").select("id, beneficiary_type, beneficiary_id, amount_cents, currency, provider, provider_payout_id, status, reason, approved_by, second_approved_by, initiated_at, completed_at, failure_reason, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  return { events: eventsResult.data ?? [], payments: paymentsResult.data ?? [], payouts: payoutsResult.data ?? [], refunds: refundsResult.data ?? [], sourceReady: !paymentsResult.error && !eventsResult.error && !refundsResult.error && !payoutsResult.error };
}
