do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type public.notification_channel as enum ('in_app', 'email', 'sms', 'whatsapp');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('queued', 'sent', 'read', 'failed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'shipment_update',
      'payment_update',
      'mission_update',
      'kyc_update',
      'support_update',
      'security_alert'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'commission_status') then
    create type public.commission_status as enum ('calculated', 'locked', 'paid', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_proof_type') then
    create type public.delivery_proof_type as enum ('photo', 'signature', 'otp', 'qr_scan', 'document');
  end if;

  if not exists (select 1 from pg_type where typname = 'dispute_status') then
    create type public.dispute_status as enum ('open', 'in_review', 'waiting_user', 'resolved', 'rejected', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'dispute_category') then
    create type public.dispute_category as enum (
      'lost_package',
      'damaged_package',
      'late_delivery',
      'payment_issue',
      'kyc_issue',
      'other'
    );
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  shipment_id uuid references public.shipments(id) on delete cascade,
  type public.notification_type not null,
  channel public.notification_channel not null default 'in_app',
  status public.notification_status not null default 'queued',
  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 3 and 2000),
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_commissions (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  payment_intent_id uuid references public.payment_intents(id) on delete set null,
  payer_id uuid not null references public.profiles(id) on delete restrict,
  beneficiary_id uuid references public.profiles(id) on delete set null,
  currency text not null default 'EUR',
  gross_amount_cents integer not null check (gross_amount_cents > 0),
  commission_rate_bps integer not null default 1500 check (commission_rate_bps between 0 and 10000),
  commission_amount_cents integer not null check (commission_amount_cents >= 0),
  payout_amount_cents integer not null check (payout_amount_cents >= 0),
  status public.commission_status not null default 'calculated',
  metadata jsonb not null default '{}'::jsonb,
  locked_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_commissions_amounts_check
    check (gross_amount_cents = commission_amount_cents + payout_amount_cents)
);

create table if not exists public.delivery_proofs (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  mission_id uuid references public.local_delivery_missions(id) on delete set null,
  handover_qr_token_id uuid references public.handover_qr_tokens(id) on delete set null,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  proof_type public.delivery_proof_type not null,
  storage_bucket text,
  storage_path text,
  otp_confirmed boolean not null default false,
  recipient_name text,
  recipient_phone_last4 text check (recipient_phone_last4 is null or recipient_phone_last4 ~ '^[0-9]{4}$'),
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shipment_disputes (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  category public.dispute_category not null,
  status public.dispute_status not null default 'open',
  subject text not null check (char_length(subject) between 4 and 180),
  description text not null check (char_length(description) between 10 and 4000),
  resolution text,
  evidence_bucket text,
  evidence_path text,
  resolved_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_recipient_status_idx
  on public.notifications (recipient_id, status, created_at desc);
create index if not exists notifications_shipment_idx
  on public.notifications (shipment_id, created_at desc);
create index if not exists platform_commissions_shipment_idx
  on public.platform_commissions (shipment_id, status);
create index if not exists platform_commissions_participants_idx
  on public.platform_commissions (payer_id, beneficiary_id, status);
create index if not exists delivery_proofs_shipment_idx
  on public.delivery_proofs (shipment_id, created_at desc);
create index if not exists delivery_proofs_uploaded_by_idx
  on public.delivery_proofs (uploaded_by, created_at desc);
create index if not exists shipment_disputes_shipment_idx
  on public.shipment_disputes (shipment_id, status, created_at desc);
create index if not exists shipment_disputes_opened_by_idx
  on public.shipment_disputes (opened_by, status, created_at desc);
create index if not exists shipment_disputes_assigned_to_idx
  on public.shipment_disputes (assigned_to, status);

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

drop trigger if exists platform_commissions_set_updated_at on public.platform_commissions;
create trigger platform_commissions_set_updated_at
before update on public.platform_commissions
for each row execute function public.set_updated_at();

drop trigger if exists shipment_disputes_set_updated_at on public.shipment_disputes;
create trigger shipment_disputes_set_updated_at
before update on public.shipment_disputes
for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;
alter table public.platform_commissions enable row level security;
alter table public.delivery_proofs enable row level security;
alter table public.shipment_disputes enable row level security;

drop policy if exists "notifications_select_recipient_or_staff" on public.notifications;
create policy "notifications_select_recipient_or_staff" on public.notifications
for select using (
  recipient_id = auth.uid()
  or actor_id = auth.uid()
  or public.current_user_has_role(array[
    'support_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "notifications_update_recipient_read" on public.notifications;
create policy "notifications_update_recipient_read" on public.notifications
for update using (
  recipient_id = auth.uid()
  or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  recipient_id = auth.uid()
  or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "notifications_insert_staff" on public.notifications;
create policy "notifications_insert_staff" on public.notifications
for insert with check (
  public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "platform_commissions_select_participants_or_staff" on public.platform_commissions;
create policy "platform_commissions_select_participants_or_staff" on public.platform_commissions
for select using (
  payer_id = auth.uid()
  or beneficiary_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "platform_commissions_write_staff" on public.platform_commissions;
create policy "platform_commissions_write_staff" on public.platform_commissions
for all using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "delivery_proofs_select_participants_or_staff" on public.delivery_proofs;
create policy "delivery_proofs_select_participants_or_staff" on public.delivery_proofs
for select using (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = delivery_proofs.shipment_id
      and s.sender_id = auth.uid()
  )
  or exists (
    select 1
    from public.local_delivery_missions m
    where m.id = delivery_proofs.mission_id
      and m.transporter_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'support_agent',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "delivery_proofs_insert_participants_or_staff" on public.delivery_proofs;
create policy "delivery_proofs_insert_participants_or_staff" on public.delivery_proofs
for insert with check (
  uploaded_by = auth.uid()
  and (
    exists (
      select 1
      from public.shipments s
      where s.id = delivery_proofs.shipment_id
        and s.sender_id = auth.uid()
    )
    or exists (
      select 1
      from public.local_delivery_missions m
      where m.id = delivery_proofs.mission_id
        and m.transporter_id = auth.uid()
    )
    or public.current_user_has_role(array[
      'relay_agent',
      'hub_agent',
      'collection_driver',
      'operations_manager',
      'support_agent',
      'admin',
      'super_admin'
    ])
  )
);

drop policy if exists "shipment_disputes_select_participants_or_staff" on public.shipment_disputes;
create policy "shipment_disputes_select_participants_or_staff" on public.shipment_disputes
for select using (
  opened_by = auth.uid()
  or assigned_to = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = shipment_disputes.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'support_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "shipment_disputes_insert_participants" on public.shipment_disputes;
create policy "shipment_disputes_insert_participants" on public.shipment_disputes
for insert with check (
  opened_by = auth.uid()
  and (
    exists (
      select 1
      from public.shipments s
      where s.id = shipment_disputes.shipment_id
        and s.sender_id = auth.uid()
    )
    or exists (
      select 1
      from public.local_delivery_missions m
      where m.shipment_id = shipment_disputes.shipment_id
        and m.transporter_id = auth.uid()
    )
    or public.current_user_has_role(array[
      'relay_agent',
      'hub_agent',
      'collection_driver',
      'operations_manager',
      'support_agent',
      'admin',
      'super_admin'
    ])
  )
);

drop policy if exists "shipment_disputes_update_owner_or_staff" on public.shipment_disputes;
create policy "shipment_disputes_update_owner_or_staff" on public.shipment_disputes
for update using (
  opened_by = auth.uid()
  or assigned_to = auth.uid()
  or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  opened_by = auth.uid()
  or assigned_to = auth.uid()
  or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
);

create or replace function public.create_notification(
  p_recipient_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_channel public.notification_channel default 'in_app',
  p_shipment_id uuid default null,
  p_action_url text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  if not public.current_user_has_role(array[
    'support_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ]) then
    raise exception 'Insufficient permissions to create notification.';
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    shipment_id,
    type,
    title,
    body,
    channel,
    action_url,
    metadata
  ) values (
    p_recipient_id,
    auth.uid(),
    p_shipment_id,
    p_type,
    p_title,
    p_body,
    p_channel,
    p_action_url,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into notification_id;

  return notification_id;
end;
$$;

create or replace function public.mark_notification_read(
  p_notification_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set
    status = 'read',
    read_at = coalesce(read_at, now())
  where id = p_notification_id
    and (
      recipient_id = auth.uid()
      or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
    );

  if not found then
    raise exception 'Notification introuvable ou non autorisee.';
  end if;

  return p_notification_id;
end;
$$;

create or replace function public.create_shipment_dispute(
  p_shipment_id uuid,
  p_category public.dispute_category,
  p_subject text,
  p_description text,
  p_evidence_bucket text default null,
  p_evidence_path text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  dispute_id uuid;
begin
  if not exists (
    select 1
    from public.shipments s
    where s.id = p_shipment_id
      and (
        s.sender_id = auth.uid()
        or exists (
          select 1
          from public.local_delivery_missions m
          where m.shipment_id = s.id
            and m.transporter_id = auth.uid()
        )
        or public.current_user_has_role(array[
          'relay_agent',
          'hub_agent',
          'collection_driver',
          'operations_manager',
          'support_agent',
          'admin',
          'super_admin'
        ])
      )
  ) then
    raise exception 'Expedition introuvable ou non autorisee.';
  end if;

  insert into public.shipment_disputes (
    shipment_id,
    opened_by,
    category,
    subject,
    description,
    evidence_bucket,
    evidence_path
  ) values (
    p_shipment_id,
    auth.uid(),
    p_category,
    p_subject,
    p_description,
    p_evidence_bucket,
    p_evidence_path
  ) returning id into dispute_id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'dispute.created',
    'shipment_dispute',
    dispute_id,
    jsonb_build_object('shipment_id', p_shipment_id, 'category', p_category)
  );

  return dispute_id;
end;
$$;

create or replace function public.record_delivery_proof(
  p_shipment_id uuid,
  p_proof_type public.delivery_proof_type,
  p_mission_id uuid default null,
  p_handover_qr_token_id uuid default null,
  p_storage_bucket text default null,
  p_storage_path text default null,
  p_otp_confirmed boolean default false,
  p_recipient_name text default null,
  p_recipient_phone_last4 text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  proof_id uuid;
begin
  if not exists (
    select 1
    from public.shipments s
    where s.id = p_shipment_id
      and (
        s.sender_id = auth.uid()
        or exists (
          select 1
          from public.local_delivery_missions m
          where m.shipment_id = s.id
            and m.transporter_id = auth.uid()
        )
        or public.current_user_has_role(array[
          'relay_agent',
          'hub_agent',
          'collection_driver',
          'operations_manager',
          'support_agent',
          'admin',
          'super_admin'
        ])
      )
  ) then
    raise exception 'Expedition introuvable ou non autorisee.';
  end if;

  insert into public.delivery_proofs (
    shipment_id,
    mission_id,
    handover_qr_token_id,
    uploaded_by,
    proof_type,
    storage_bucket,
    storage_path,
    otp_confirmed,
    recipient_name,
    recipient_phone_last4,
    metadata
  ) values (
    p_shipment_id,
    p_mission_id,
    p_handover_qr_token_id,
    auth.uid(),
    p_proof_type,
    p_storage_bucket,
    p_storage_path,
    p_otp_confirmed,
    p_recipient_name,
    p_recipient_phone_last4,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into proof_id;

  return proof_id;
end;
$$;

create or replace function public.calculate_platform_commission(
  p_shipment_id uuid,
  p_payment_intent_id uuid,
  p_gross_amount_cents integer,
  p_currency text default 'EUR',
  p_commission_rate_bps integer default 1500,
  p_beneficiary_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  commission_id uuid;
  payer uuid;
  commission_amount integer;
  payout_amount integer;
begin
  if not public.current_user_has_role(array['operations_manager', 'admin', 'super_admin']) then
    raise exception 'Insufficient permissions to calculate commission.';
  end if;

  select sender_id into payer
  from public.shipments
  where id = p_shipment_id;

  if payer is null then
    raise exception 'Expedition introuvable.';
  end if;

  commission_amount := floor((p_gross_amount_cents * p_commission_rate_bps)::numeric / 10000)::integer;
  payout_amount := p_gross_amount_cents - commission_amount;

  insert into public.platform_commissions (
    shipment_id,
    payment_intent_id,
    payer_id,
    beneficiary_id,
    currency,
    gross_amount_cents,
    commission_rate_bps,
    commission_amount_cents,
    payout_amount_cents
  ) values (
    p_shipment_id,
    p_payment_intent_id,
    payer,
    p_beneficiary_id,
    p_currency,
    p_gross_amount_cents,
    p_commission_rate_bps,
    commission_amount,
    payout_amount
  ) returning id into commission_id;

  return commission_id;
end;
$$;
