-- Orange Money production foundation. No provider endpoint or credential is embedded here.

do $$ begin
  create type public.payment_lifecycle_status as enum (
    'created', 'pending', 'awaiting_customer_validation', 'processing', 'succeeded',
    'failed', 'expired', 'cancelled', 'refund_pending', 'refunded',
    'partially_refunded', 'payout_pending', 'payout_succeeded', 'payout_failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_event_processing_status as enum ('received', 'processed', 'ignored', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.refund_status as enum ('created', 'pending', 'succeeded', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

alter type public.payout_status add value if not exists 'payout_pending';
alter type public.payout_status add value if not exists 'payout_succeeded';
alter type public.payout_status add value if not exists 'payout_failed';

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  provider text not null check (provider in ('test', 'orange_money', 'wave', 'card')),
  provider_transaction_id text,
  internal_reference text not null unique,
  idempotency_key text not null,
  amount bigint not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status public.payment_lifecycle_status not null default 'created',
  payment_type text not null default 'shipment' check (payment_type in ('shipment', 'supplement', 'adjustment')),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  initiated_at timestamptz,
  confirmed_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  last_provider_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, idempotency_key)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  event_type text not null,
  provider_event_id text,
  verified boolean not null default false,
  sanitized_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(sanitized_payload) = 'object'),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status public.payment_event_processing_status not null default 'received',
  failure_reason text
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  amount bigint not null check (amount > 0),
  reason text not null check (char_length(reason) between 3 and 500),
  provider_refund_id text,
  idempotency_key text not null unique,
  status public.refund_status not null default 'created',
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payouts
  add column if not exists beneficiary_type text not null default 'profile',
  add column if not exists provider text not null default 'test',
  add column if not exists provider_payout_id text,
  add column if not exists reason text,
  add column if not exists approved_by uuid references public.profiles(id) on delete restrict,
  add column if not exists second_approved_by uuid references public.profiles(id) on delete restrict,
  add column if not exists initiated_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists failure_reason text,
  add column if not exists idempotency_key text;

create unique index if not exists payouts_provider_reference_unique
  on public.payouts (provider, provider_payout_id) where provider_payout_id is not null;
create unique index if not exists payouts_idempotency_unique
  on public.payouts (idempotency_key) where idempotency_key is not null;

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('payment', 'refund', 'payout', 'commission', 'adjustment')),
  debit_account text not null,
  credit_account text not null,
  amount bigint not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  related_payment_id uuid references public.payments(id) on delete restrict,
  related_payout_id uuid references public.payouts(id) on delete restrict,
  immutable_reference text not null unique,
  created_at timestamptz not null default now(),
  check (debit_account <> credit_account),
  check (related_payment_id is not null or related_payout_id is not null)
);

create index if not exists payments_shipment_idx on public.payments (shipment_id, created_at desc);
create unique index if not exists payments_provider_transaction_unique on public.payments (provider, provider_transaction_id) where provider_transaction_id is not null;
create index if not exists payments_customer_idx on public.payments (customer_id, created_at desc);
create index if not exists payments_finance_queue_idx on public.payments (status, country_code, currency, created_at desc);
create index if not exists payment_events_queue_idx on public.payment_events (processing_status, received_at);
create unique index if not exists payment_events_provider_unique on public.payment_events (payment_id, provider_event_id) where provider_event_id is not null;
create index if not exists refunds_payment_idx on public.refunds (payment_id, created_at desc);
create unique index if not exists refunds_provider_reference_unique on public.refunds (provider_refund_id) where provider_refund_id is not null;
create index if not exists ledger_payment_idx on public.ledger_entries (related_payment_id, created_at);
create index if not exists ledger_payout_idx on public.ledger_entries (related_payout_id, created_at);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();
drop trigger if exists refunds_set_updated_at on public.refunds;
create trigger refunds_set_updated_at before update on public.refunds
for each row execute function public.set_updated_at();

create or replace function public.prevent_ledger_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'ledger_entries are immutable';
end $$;
drop trigger if exists ledger_entries_immutable on public.ledger_entries;
create trigger ledger_entries_immutable before update or delete on public.ledger_entries
for each row execute function public.prevent_ledger_mutation();

create or replace function public.apply_verified_payment_event(
  p_internal_reference text,
  p_provider_event_id text,
  p_provider_transaction_id text,
  p_event_type text,
  p_status public.payment_lifecycle_status,
  p_sanitized_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_event_id uuid;
begin
  if p_provider_event_id is null or char_length(p_provider_event_id) < 3 then
    raise exception 'provider event id required';
  end if;
  select * into v_payment from public.payments
    where internal_reference = p_internal_reference for update;
  if not found then raise exception 'payment not found'; end if;
  if v_payment.provider_transaction_id is not null
     and p_provider_transaction_id is distinct from v_payment.provider_transaction_id then
    raise exception 'provider transaction mismatch';
  end if;

  insert into public.payment_events (payment_id, event_type, provider_event_id, verified, sanitized_payload, processed_at, processing_status)
  values (v_payment.id, p_event_type, p_provider_event_id, true, coalesce(p_sanitized_payload, '{}'::jsonb), now(), 'processed')
  on conflict (payment_id, provider_event_id) where provider_event_id is not null do nothing returning id into v_event_id;
  if v_event_id is null then return false; end if;

  update public.payments set
    provider_transaction_id = coalesce(provider_transaction_id, p_provider_transaction_id),
    status = case when status = 'succeeded' and p_status <> 'refund_pending' and p_status <> 'refunded' and p_status <> 'partially_refunded' then status else p_status end,
    confirmed_at = case when p_status = 'succeeded' then coalesce(confirmed_at, now()) else confirmed_at end,
    failed_at = case when p_status = 'failed' then coalesce(failed_at, now()) else failed_at end,
    refunded_at = case when p_status in ('refunded','partially_refunded') then coalesce(refunded_at, now()) else refunded_at end,
    last_provider_check_at = now()
  where id = v_payment.id;

  if p_status = 'succeeded' then
    insert into public.ledger_entries (transaction_type, debit_account, credit_account, amount, currency, related_payment_id, immutable_reference)
    values ('payment', 'orange_money_clearing', 'customer_payments', v_payment.amount, v_payment.currency, v_payment.id, 'payment:' || v_payment.internal_reference)
    on conflict (immutable_reference) do nothing;
  end if;
  return true;
end $$;

revoke all on function public.apply_verified_payment_event(text,text,text,text,public.payment_lifecycle_status,jsonb) from public, anon, authenticated;
grant execute on function public.apply_verified_payment_event(text,text,text,text,public.payment_lifecycle_status,jsonb) to service_role;

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;
alter table public.ledger_entries enable row level security;

drop policy if exists payments_select_owner_or_finance on public.payments;
create policy payments_select_owner_or_finance on public.payments for select using (
  customer_id = auth.uid() or public.current_user_has_role(array[
    'finance_manager','finance_agent','accounting_agent','reconciliation_agent',
    'payment_agent','refund_agent','auditor','admin','super_admin'
  ])
);

drop policy if exists payment_events_select_owner_or_finance on public.payment_events;
create policy payment_events_select_owner_or_finance on public.payment_events for select using (
  exists (select 1 from public.payments p where p.id = payment_events.payment_id and (
    p.customer_id = auth.uid() or public.current_user_has_role(array[
      'finance_manager','finance_agent','accounting_agent','reconciliation_agent',
      'payment_agent','refund_agent','auditor','admin','super_admin'
    ])
  ))
);

drop policy if exists refunds_select_owner_or_finance on public.refunds;
create policy refunds_select_owner_or_finance on public.refunds for select using (
  exists (select 1 from public.payments p where p.id = refunds.payment_id and (
    p.customer_id = auth.uid() or public.current_user_has_role(array[
      'finance_manager','finance_agent','accounting_agent','reconciliation_agent',
      'payment_agent','refund_agent','auditor','admin','super_admin'
    ])
  ))
);

drop policy if exists ledger_select_finance on public.ledger_entries;
create policy ledger_select_finance on public.ledger_entries for select using (
  public.current_user_has_role(array[
    'finance_manager','finance_agent','accounting_agent','reconciliation_agent',
    'auditor','admin','super_admin'
  ])
);

comment on column public.payments.amount is 'Montant en unité monétaire mineure; jamais fourni par le navigateur.';
comment on column public.payments.metadata is 'Métadonnées nettoyées uniquement; aucun secret, OTP ou numéro complet.';
comment on table public.ledger_entries is 'Journal financier append-only; toute mise à jour ou suppression est refusée.';
