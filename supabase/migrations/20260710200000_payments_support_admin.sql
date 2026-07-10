create type public.payment_status as enum (
  'requires_payment_method',
  'requires_confirmation',
  'succeeded',
  'cancelled',
  'refunded'
);
create type public.payout_status as enum ('pending', 'paid', 'failed', 'cancelled');
create type public.support_ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type public.support_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.support_category as enum ('shipment', 'payment', 'kyc', 'damage', 'delay', 'other');

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'sandbox',
  provider_reference text not null,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR',
  status public.payment_status not null default 'requires_confirmation',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_reference)
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.profiles(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR',
  status public.payout_status not null default 'pending',
  scheduled_for date,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  category public.support_category not null,
  priority public.support_priority not null default 'normal',
  status public.support_ticket_status not null default 'open',
  subject text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.audit_log_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.platform_metrics_daily (
  metric_date date primary key,
  shipments_created integer not null default 0,
  payments_succeeded integer not null default 0,
  support_tickets_opened integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_intents_shipment_idx on public.payment_intents (shipment_id, status);
create index payment_intents_payer_idx on public.payment_intents (payer_id, created_at desc);
create index payouts_beneficiary_idx on public.payouts (beneficiary_id, status);
create index support_tickets_requester_idx on public.support_tickets (requester_id, status, created_at desc);
create index support_tickets_assignee_idx on public.support_tickets (assigned_to, status);
create index support_messages_ticket_idx on public.support_messages (ticket_id, created_at);
create index audit_log_events_entity_idx on public.audit_log_events (entity_type, entity_id, created_at desc);

create trigger payment_intents_set_updated_at
before update on public.payment_intents
for each row execute function public.set_updated_at();

create trigger payouts_set_updated_at
before update on public.payouts
for each row execute function public.set_updated_at();

create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

create trigger platform_metrics_daily_set_updated_at
before update on public.platform_metrics_daily
for each row execute function public.set_updated_at();

alter table public.payment_intents enable row level security;
alter table public.payouts enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.audit_log_events enable row level security;
alter table public.platform_metrics_daily enable row level security;

create policy "payment_intents_select_owner_or_staff" on public.payment_intents
for select using (
  payer_id = auth.uid()
  or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
);

create policy "payment_intents_insert_owner" on public.payment_intents
for insert with check (payer_id = auth.uid());

create policy "payment_intents_update_staff" on public.payment_intents
for update using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "payouts_select_beneficiary_or_staff" on public.payouts
for select using (
  beneficiary_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "payouts_write_staff" on public.payouts
for all using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "support_tickets_select_participants" on public.support_tickets
for select using (
  requester_id = auth.uid()
  or assigned_to = auth.uid()
  or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
);

create policy "support_tickets_insert_own" on public.support_tickets
for insert with check (requester_id = auth.uid());

create policy "support_tickets_update_staff" on public.support_tickets
for update using (
  public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
);

create policy "support_messages_select_participants" on public.support_messages
for select using (
  exists (
    select 1
    from public.support_tickets t
    where t.id = support_messages.ticket_id
      and (
        t.requester_id = auth.uid()
        or t.assigned_to = auth.uid()
        or public.current_user_has_role(array[
          'support_agent',
          'operations_manager',
          'admin',
          'super_admin'
        ])
      )
  )
);

create policy "support_messages_insert_participants" on public.support_messages
for insert with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.support_tickets t
    where t.id = support_messages.ticket_id
      and (
        t.requester_id = auth.uid()
        or t.assigned_to = auth.uid()
        or public.current_user_has_role(array[
          'support_agent',
          'operations_manager',
          'admin',
          'super_admin'
        ])
      )
  )
);

create policy "audit_log_events_select_admins" on public.audit_log_events
for select using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "audit_log_events_insert_authenticated" on public.audit_log_events
for insert with check (auth.uid() is not null);

create policy "platform_metrics_select_staff" on public.platform_metrics_daily
for select using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "platform_metrics_write_staff" on public.platform_metrics_daily
for all using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create or replace function public.create_sandbox_payment_intent(
  p_shipment_id uuid,
  p_amount_cents integer,
  p_currency text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_reference text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.shipments s
    where s.id = p_shipment_id
      and s.sender_id = auth.uid()
  ) then
    raise exception 'Shipment not found for payer';
  end if;

  v_reference := 'sandbox_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.payment_intents (
    provider_reference,
    shipment_id,
    payer_id,
    amount_cents,
    currency,
    status,
    metadata
  )
  values (
    v_reference,
    p_shipment_id,
    auth.uid(),
    p_amount_cents,
    p_currency,
    'requires_confirmation',
    jsonb_build_object('mode', 'sandbox')
  )
  returning id into v_payment_id;

  insert into public.audit_log_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    'payment_intent.created',
    'payment_intent',
    v_payment_id,
    jsonb_build_object('shipment_id', p_shipment_id, 'amount_cents', p_amount_cents)
  );

  return v_payment_id;
end;
$$;

create or replace function public.create_support_ticket(
  p_subject text,
  p_category public.support_category,
  p_priority public.support_priority,
  p_initial_message text,
  p_shipment_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ticket_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.support_tickets (
    requester_id,
    shipment_id,
    category,
    priority,
    status,
    subject
  )
  values (
    auth.uid(),
    p_shipment_id,
    p_category,
    p_priority,
    'open',
    p_subject
  )
  returning id into v_ticket_id;

  insert into public.support_messages (
    ticket_id,
    author_id,
    body
  )
  values (
    v_ticket_id,
    auth.uid(),
    p_initial_message
  );

  insert into public.audit_log_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    'support_ticket.created',
    'support_ticket',
    v_ticket_id,
    jsonb_build_object('category', p_category, 'priority', p_priority)
  );

  return v_ticket_id;
end;
$$;
