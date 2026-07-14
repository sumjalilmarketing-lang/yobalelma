do $$
begin
  if not exists (select 1 from pg_type where typname = 'final_delivery_mode') then
    create type public.final_delivery_mode as enum ('relay_pickup', 'home_delivery');
  end if;

  if not exists (select 1 from pg_type where typname = 'final_delivery_status') then
    create type public.final_delivery_status as enum (
      'destination_batch_received',
      'destination_package_confirmed',
      'destination_package_missing',
      'destination_package_damaged',
      'stored_at_destination_relay',
      'awaiting_recipient_choice',
      'awaiting_recipient_pickup',
      'awaiting_final_delivery',
      'ready_for_recipient',
      'delivery_assigned',
      'out_for_delivery',
      'delivery_attempted',
      'recipient_absent',
      'invalid_address',
      'otp_failed',
      'delivery_rescheduled',
      'returned_to_relay',
      'refused_by_recipient',
      'delivery_blocked',
      'return_requested',
      'delivered',
      'disputed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'delivery_otp_status') then
    create type public.delivery_otp_status as enum ('active', 'used', 'expired', 'revoked', 'blocked');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_delivery_status') then
    create type public.notification_delivery_status as enum ('queued', 'sent', 'sandboxed', 'failed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'manual_correction_status') then
    create type public.manual_correction_status as enum ('requested', 'approved', 'rejected', 'applied', 'cancelled');
  end if;
end $$;

alter table public.local_delivery_missions
  add column if not exists mission_type text not null default 'sender_to_recipient',
  add column if not exists payout_eligible_for_release boolean not null default false,
  add column if not exists payout_blocked_reason text,
  add column if not exists payout_release_at timestamptz,
  add column if not exists final_delivery_order_id uuid;

alter table public.local_delivery_missions
  drop constraint if exists local_delivery_missions_mission_type_check,
  add constraint local_delivery_missions_mission_type_check
    check (mission_type in ('sender_to_recipient', 'relay_to_recipient'));

create table if not exists public.final_delivery_orders (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  batch_id uuid references public.hub_batches(id) on delete set null,
  destination_relay_point_id uuid references public.relay_points(id) on delete set null,
  delivery_mode public.final_delivery_mode,
  status public.final_delivery_status not null default 'destination_batch_received',
  storage_location text,
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_name text,
  recipient_phone_last4 text check (recipient_phone_last4 is null or recipient_phone_last4 ~ '^[0-9]{4}$'),
  recipient_email text,
  pickup_deadline_at timestamptz,
  final_delivery_mission_id uuid references public.local_delivery_missions(id) on delete set null,
  traveler_payout_eligible boolean not null default false,
  final_driver_payout_eligible boolean not null default false,
  payout_blocked_reason text,
  anomaly_count integer not null default 0 check (anomaly_count >= 0),
  last_event_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_id)
);

create table if not exists public.destination_package_checks (
  id uuid primary key default gen_random_uuid(),
  final_delivery_order_id uuid not null references public.final_delivery_orders(id) on delete cascade,
  batch_id uuid references public.hub_batches(id) on delete set null,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  relay_point_id uuid references public.relay_points(id) on delete set null,
  checked_by uuid references public.profiles(id) on delete set null,
  status public.final_delivery_status not null,
  package_condition text not null default 'conforme',
  storage_location text,
  photo_paths text[] not null default array[]::text[],
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_otps (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  final_delivery_order_id uuid references public.final_delivery_orders(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  delivery_mode public.final_delivery_mode not null,
  relay_point_id uuid references public.relay_points(id) on delete set null,
  mission_id uuid references public.local_delivery_missions(id) on delete set null,
  code_hash text not null,
  salt text not null,
  status public.delivery_otp_status not null default 'active',
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  resend_count integer not null default 0 check (resend_count >= 0 and resend_count <= 10),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 10),
  blocked_until timestamptz,
  last_sent_channel text not null default 'in_app',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_otps_no_plain_code_check check (code_hash !~ '^[0-9]{4,8}$')
);

create table if not exists public.otp_attempts (
  id uuid primary key default gen_random_uuid(),
  otp_id uuid references public.delivery_otps(id) on delete set null,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  attempted_by uuid references public.profiles(id) on delete set null,
  success boolean not null default false,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.otp_events (
  id uuid primary key default gen_random_uuid(),
  otp_id uuid references public.delivery_otps(id) on delete set null,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.proof_of_delivery (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  final_delivery_order_id uuid references public.final_delivery_orders(id) on delete set null,
  mission_id uuid references public.local_delivery_missions(id) on delete set null,
  delivery_proof_id uuid references public.delivery_proofs(id) on delete set null,
  recorded_by uuid references public.profiles(id) on delete set null,
  method text not null check (method in ('otp', 'qr', 'signature', 'manual_override')),
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_name text,
  recipient_phone_last4 text check (recipient_phone_last4 is null or recipient_phone_last4 ~ '^[0-9]{4}$'),
  location_label text,
  geo_latitude numeric(10,7),
  geo_longitude numeric(10,7),
  device_label text,
  public_summary jsonb not null default '{}'::jsonb,
  private_metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.proof_of_delivery_summaries (
  id uuid primary key default gen_random_uuid(),
  proof_of_delivery_id uuid not null references public.proof_of_delivery(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  method text not null,
  delivered_at timestamptz not null,
  location_label text,
  recipient_label text,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (proof_of_delivery_id)
);

create table if not exists public.delivery_signatures (
  id uuid primary key default gen_random_uuid(),
  proof_of_delivery_id uuid not null references public.proof_of_delivery(id) on delete cascade,
  signer_name text not null,
  signature_path text,
  signature_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_photos (
  id uuid primary key default gen_random_uuid(),
  proof_of_delivery_id uuid not null references public.proof_of_delivery(id) on delete cascade,
  storage_bucket text not null default 'proof-of-delivery',
  storage_path text not null,
  purpose text not null default 'delivery_proof',
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  final_delivery_order_id uuid references public.final_delivery_orders(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  status public.final_delivery_status not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_templates (
  key text primary key,
  channel public.notification_channel not null default 'in_app',
  title_template text not null,
  body_template text not null,
  sandbox_provider boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  final_delivery_order_id uuid references public.final_delivery_orders(id) on delete set null,
  event_key text not null,
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  recipient_contact jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid not null references public.notification_events(id) on delete cascade,
  channel public.notification_channel not null,
  provider text not null default 'sandbox',
  status public.notification_delivery_status not null default 'queued',
  provider_reference text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.user_notification_preferences (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  enabled boolean not null default true,
  quiet_hours jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (profile_id, channel)
);

create table if not exists public.payout_release_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  final_delivery_order_id uuid references public.final_delivery_orders(id) on delete set null,
  beneficiary_id uuid references public.profiles(id) on delete set null,
  beneficiary_role text not null check (beneficiary_role in ('traveler', 'final_driver')),
  eligible boolean not null default false,
  blocked_reason text,
  idempotency_key text not null unique,
  payout_id uuid references public.payouts(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_corrections (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  permission_key text not null,
  old_value jsonb not null default '{}'::jsonb,
  new_value jsonb not null default '{}'::jsonb,
  reason text not null check (char_length(reason) >= 8),
  comment text not null check (char_length(comment) >= 8),
  status public.manual_correction_status not null default 'requested',
  requires_second_approval boolean not null default false,
  requested_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  applied_at timestamptz,
  request_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists final_delivery_orders_status_idx
  on public.final_delivery_orders (status, updated_at desc);
create index if not exists final_delivery_orders_relay_idx
  on public.final_delivery_orders (destination_relay_point_id, status, updated_at desc);
create index if not exists final_delivery_orders_batch_idx
  on public.final_delivery_orders (batch_id, status);
create index if not exists destination_package_checks_batch_idx
  on public.destination_package_checks (batch_id, status, created_at desc);
create index if not exists delivery_otps_lookup_idx
  on public.delivery_otps (shipment_id, delivery_mode, status, expires_at desc);
create unique index if not exists delivery_otps_one_active_idx
  on public.delivery_otps (shipment_id, delivery_mode)
  where status = 'active';
create index if not exists otp_attempts_shipment_idx
  on public.otp_attempts (shipment_id, created_at desc);
create index if not exists otp_events_shipment_idx
  on public.otp_events (shipment_id, created_at desc);
create index if not exists proof_of_delivery_shipment_idx
  on public.proof_of_delivery (shipment_id, created_at desc);
create index if not exists proof_of_delivery_summaries_sender_idx
  on public.proof_of_delivery_summaries (sender_id, delivered_at desc);
create index if not exists delivery_events_shipment_idx
  on public.delivery_events (shipment_id, created_at desc);
create index if not exists notification_events_shipment_idx
  on public.notification_events (shipment_id, created_at desc);
create index if not exists notification_deliveries_event_idx
  on public.notification_deliveries (notification_event_id, channel);
create index if not exists payout_release_events_shipment_idx
  on public.payout_release_events (shipment_id, beneficiary_role, created_at desc);
create index if not exists manual_corrections_entity_idx
  on public.manual_corrections (entity_type, entity_id, created_at desc);
create index if not exists manual_corrections_status_idx
  on public.manual_corrections (status, created_at desc);

drop trigger if exists final_delivery_orders_set_updated_at on public.final_delivery_orders;
create trigger final_delivery_orders_set_updated_at
before update on public.final_delivery_orders
for each row execute function public.set_updated_at();

drop trigger if exists delivery_otps_set_updated_at on public.delivery_otps;
create trigger delivery_otps_set_updated_at
before update on public.delivery_otps
for each row execute function public.set_updated_at();

drop trigger if exists notification_templates_set_updated_at on public.notification_templates;
create trigger notification_templates_set_updated_at
before update on public.notification_templates
for each row execute function public.set_updated_at();

drop trigger if exists user_notification_preferences_set_updated_at on public.user_notification_preferences;
create trigger user_notification_preferences_set_updated_at
before update on public.user_notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists manual_corrections_set_updated_at on public.manual_corrections;
create trigger manual_corrections_set_updated_at
before update on public.manual_corrections
for each row execute function public.set_updated_at();

alter table public.final_delivery_orders enable row level security;
alter table public.destination_package_checks enable row level security;
alter table public.delivery_otps enable row level security;
alter table public.otp_attempts enable row level security;
alter table public.otp_events enable row level security;
alter table public.proof_of_delivery enable row level security;
alter table public.proof_of_delivery_summaries enable row level security;
alter table public.delivery_signatures enable row level security;
alter table public.delivery_photos enable row level security;
alter table public.delivery_events enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.payout_release_events enable row level security;
alter table public.manual_corrections enable row level security;

drop policy if exists "final_delivery_orders_select_participants_or_staff" on public.final_delivery_orders;
create policy "final_delivery_orders_select_participants_or_staff" on public.final_delivery_orders
for select using (
  exists (
    select 1
    from public.shipments s
    where s.id = final_delivery_orders.shipment_id
      and s.sender_id = auth.uid()
  )
  or exists (
    select 1
    from public.local_delivery_missions m
    where m.id = final_delivery_orders.final_delivery_mission_id
      and m.transporter_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'relay_agent',
    'relay_manager',
    'operations_manager',
    'support_agent',
    'finance_agent',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "final_delivery_orders_write_staff" on public.final_delivery_orders;
create policy "final_delivery_orders_write_staff" on public.final_delivery_orders
for all using (
  public.current_user_has_role(array[
    'relay_agent',
    'relay_manager',
    'operations_manager',
    'support_agent',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'relay_agent',
    'relay_manager',
    'operations_manager',
    'support_agent',
    'admin',
    'super_admin'
  ])
);

drop policy if exists "destination_package_checks_select_staff" on public.destination_package_checks;
create policy "destination_package_checks_select_staff" on public.destination_package_checks
for select using (
  public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "destination_package_checks_write_staff" on public.destination_package_checks;
create policy "destination_package_checks_write_staff" on public.destination_package_checks
for all using (
  public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "delivery_otps_select_authorized" on public.delivery_otps;
create policy "delivery_otps_select_authorized" on public.delivery_otps
for select using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = delivery_otps.shipment_id
      and s.sender_id = auth.uid()
  )
  or exists (
    select 1
    from public.local_delivery_missions m
    where m.id = delivery_otps.mission_id
      and m.transporter_id = auth.uid()
  )
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "delivery_otps_write_authorized" on public.delivery_otps;
create policy "delivery_otps_write_authorized" on public.delivery_otps
for all using (
  created_by = auth.uid()
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
) with check (
  created_by = auth.uid()
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "otp_attempts_select_staff" on public.otp_attempts;
create policy "otp_attempts_select_staff" on public.otp_attempts
for select using (
  attempted_by = auth.uid()
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "otp_events_select_staff" on public.otp_events;
create policy "otp_events_select_staff" on public.otp_events
for select using (
  actor_id = auth.uid()
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "proof_of_delivery_select_authorized_summary" on public.proof_of_delivery;
create policy "proof_of_delivery_select_private_authorized" on public.proof_of_delivery
for select using (
  recorded_by = auth.uid()
  or exists (
    select 1
    from public.local_delivery_missions m
    where m.id = proof_of_delivery.mission_id
      and m.transporter_id = auth.uid()
  )
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "proof_of_delivery_insert_authorized" on public.proof_of_delivery;
create policy "proof_of_delivery_insert_authorized" on public.proof_of_delivery
for insert with check (
  recorded_by = auth.uid()
  and (
    exists (
      select 1
      from public.local_delivery_missions m
      where m.id = proof_of_delivery.mission_id
        and m.transporter_id = auth.uid()
    )
    or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
  )
);

drop policy if exists "proof_of_delivery_summaries_select_sender_or_staff" on public.proof_of_delivery_summaries;
create policy "proof_of_delivery_summaries_select_sender_or_staff" on public.proof_of_delivery_summaries
for select using (
  sender_id = auth.uid()
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "proof_of_delivery_summaries_insert_staff" on public.proof_of_delivery_summaries;
create policy "proof_of_delivery_summaries_insert_staff" on public.proof_of_delivery_summaries
for insert with check (
  public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "delivery_private_proofs_select_staff_only" on public.delivery_signatures;
create policy "delivery_private_proofs_select_staff_only" on public.delivery_signatures
for select using (
  public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "delivery_private_photos_select_staff_only" on public.delivery_photos;
create policy "delivery_private_photos_select_staff_only" on public.delivery_photos
for select using (
  public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "delivery_events_select_authorized" on public.delivery_events;
create policy "delivery_events_select_authorized" on public.delivery_events
for select using (
  actor_id = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = delivery_events.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "notification_templates_select_staff" on public.notification_templates;
create policy "notification_templates_select_staff" on public.notification_templates
for select using (
  public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "notification_templates_write_admin" on public.notification_templates;
create policy "notification_templates_write_admin" on public.notification_templates
for all using (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "notification_events_select_authorized" on public.notification_events;
create policy "notification_events_select_authorized" on public.notification_events
for select using (
  recipient_profile_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = notification_events.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "notification_deliveries_select_staff" on public.notification_deliveries;
create policy "notification_deliveries_select_staff" on public.notification_deliveries
for select using (
  public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "user_notification_preferences_select_own_or_staff" on public.user_notification_preferences;
create policy "user_notification_preferences_select_own_or_staff" on public.user_notification_preferences
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array['support_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "user_notification_preferences_write_own" on public.user_notification_preferences;
create policy "user_notification_preferences_write_own" on public.user_notification_preferences
for all using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "payout_release_events_select_authorized" on public.payout_release_events;
create policy "payout_release_events_select_authorized" on public.payout_release_events
for select using (
  beneficiary_id = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = payout_release_events.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array['finance_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "manual_corrections_select_staff" on public.manual_corrections;
create policy "manual_corrections_select_staff" on public.manual_corrections
for select using (
  public.current_user_has_role(array['operations_manager', 'support_agent', 'finance_agent', 'admin', 'super_admin'])
);

drop policy if exists "manual_corrections_write_admin" on public.manual_corrections;
create policy "manual_corrections_write_admin" on public.manual_corrections
for all using (
  public.current_user_has_role(array['operations_manager', 'support_agent', 'finance_agent', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['operations_manager', 'support_agent', 'finance_agent', 'admin', 'super_admin'])
);

insert into public.notification_templates (key, channel, title_template, body_template, sandbox_provider)
values
  ('destination_received', 'in_app', 'Colis recu au relais destination', 'Votre colis {{tracking_code}} est arrive au relais destination.', false),
  ('otp_generated', 'in_app', 'Code de remise genere', 'Un OTP a usage unique est disponible pour {{tracking_code}}.', false),
  ('otp_resend', 'in_app', 'Code de remise renouvele', 'Un nouvel OTP a usage unique remplace le precedent.', false),
  ('final_delivery_scheduled', 'in_app', 'Livraison finale programmee', 'Une mission de livraison finale est en preparation pour {{tracking_code}}.', false),
  ('final_delivery_completed', 'in_app', 'Colis livre', 'La remise de {{tracking_code}} est confirmee.', false),
  ('delivery_exception', 'in_app', 'Anomalie livraison', 'Une anomalie est ouverte sur {{tracking_code}}.', false),
  ('external_sms_sandbox', 'sms', 'Sandbox SMS Yobalelma', 'Provider SMS sandbox pour {{tracking_code}}.', true),
  ('external_whatsapp_sandbox', 'whatsapp', 'Sandbox WhatsApp Yobalelma', 'Provider WhatsApp sandbox pour {{tracking_code}}.', true),
  ('external_email_sandbox', 'email', 'Sandbox email Yobalelma', 'Provider email sandbox pour {{tracking_code}}.', true)
on conflict (key) do update set
  channel = excluded.channel,
  title_template = excluded.title_template,
  body_template = excluded.body_template,
  sandbox_provider = excluded.sandbox_provider,
  updated_at = now();

create or replace function public.hash_delivery_otp(p_code text, p_salt text)
returns text
language sql
immutable
set search_path = public, extensions, pg_catalog
as $$
  select encode(digest(p_salt || ':' || p_code, 'sha256'), 'hex');
$$;

create or replace function public.assert_final_delivery_staff()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.current_user_has_role(array[
    'relay_agent',
    'relay_manager',
    'operations_manager',
    'support_agent',
    'admin',
    'super_admin'
  ]) then
    raise exception 'Insufficient final delivery permissions';
  end if;
end;
$$;

create or replace function public.record_final_delivery_event(
  p_shipment_id uuid,
  p_order_id uuid,
  p_status public.final_delivery_status,
  p_event_type text,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  insert into public.delivery_events (
    final_delivery_order_id,
    shipment_id,
    actor_id,
    event_type,
    status,
    note,
    metadata
  )
  values (
    p_order_id,
    p_shipment_id,
    auth.uid(),
    p_event_type,
    p_status,
    p_note,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  update public.final_delivery_orders
  set status = p_status,
      last_event_at = now(),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_order_id;

  return v_event_id;
end;
$$;

create or replace function public.enqueue_final_delivery_notification(
  p_shipment_id uuid,
  p_order_id uuid,
  p_event_key text,
  p_title text,
  p_body text,
  p_recipient_profile_id uuid default null,
  p_recipient_contact jsonb default '{}'::jsonb,
  p_action_url text default null,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  insert into public.notification_events (
    shipment_id,
    final_delivery_order_id,
    event_key,
    recipient_profile_id,
    recipient_contact,
    payload,
    created_by
  )
  values (
    p_shipment_id,
    p_order_id,
    p_event_key,
    p_recipient_profile_id,
    coalesce(p_recipient_contact, '{}'::jsonb),
    coalesce(p_payload, '{}'::jsonb),
    auth.uid()
  )
  returning id into v_event_id;

  if p_recipient_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      actor_id,
      shipment_id,
      type,
      channel,
      status,
      title,
      body,
      action_url,
      metadata
    )
    values (
      p_recipient_profile_id,
      auth.uid(),
      p_shipment_id,
      'shipment_update',
      'in_app',
      'queued',
      p_title,
      p_body,
      p_action_url,
      jsonb_build_object('event_key', p_event_key, 'notification_event_id', v_event_id)
    );

    insert into public.notification_deliveries (notification_event_id, channel, provider, status, sent_at)
    values (v_event_id, 'in_app', 'supabase_in_app', 'sent', now());
  end if;

  insert into public.notification_deliveries (notification_event_id, channel, provider, status)
  values
    (v_event_id, 'email', 'sandbox', 'sandboxed'),
    (v_event_id, 'sms', 'sandbox', 'sandboxed'),
    (v_event_id, 'whatsapp', 'sandbox', 'sandboxed')
  on conflict do nothing;

  return v_event_id;
end;
$$;

create or replace function public.release_traveler_payout_if_eligible(
  p_order_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.final_delivery_orders%rowtype;
  v_batch public.hub_batches%rowtype;
  v_shipment public.shipments%rowtype;
  v_event_id uuid;
  v_payout_id uuid;
  v_key text;
begin
  select * into v_order from public.final_delivery_orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'Final delivery order not found';
  end if;

  select * into v_shipment from public.shipments where id = v_order.shipment_id;
  select * into v_batch from public.hub_batches where id = v_order.batch_id;

  v_key := 'traveler:' || v_order.shipment_id::text || ':' || coalesce(v_order.batch_id::text, 'no-batch');

  if v_order.anomaly_count > 0 or v_order.payout_blocked_reason is not null or v_batch.traveler_id is null then
    insert into public.payout_release_events (
      shipment_id,
      final_delivery_order_id,
      beneficiary_id,
      beneficiary_role,
      eligible,
      blocked_reason,
      idempotency_key,
      created_by
    )
    values (
      v_order.shipment_id,
      v_order.id,
      v_batch.traveler_id,
      'traveler',
      false,
      coalesce(v_order.payout_blocked_reason, 'traveler_or_order_not_eligible'),
      v_key,
      auth.uid()
    )
    on conflict (idempotency_key) do update set
      eligible = excluded.eligible,
      blocked_reason = excluded.blocked_reason
    returning id into v_event_id;

    return v_event_id;
  end if;

  insert into public.payouts (
    beneficiary_id,
    shipment_id,
    amount_cents,
    currency,
    status,
    scheduled_for,
    metadata
  )
  select
    v_batch.traveler_id,
    v_order.shipment_id,
    greatest((v_shipment.estimated_price_cents / 3)::integer, 100),
    v_shipment.currency,
    'pending',
    current_date + 1,
    jsonb_build_object('source', 'traveler_destination_release', 'order_id', v_order.id, 'batch_id', v_order.batch_id)
  where not exists (
    select 1
    from public.payouts p
    where p.shipment_id = v_order.shipment_id
      and p.beneficiary_id = v_batch.traveler_id
      and p.metadata->>'source' = 'traveler_destination_release'
  )
  returning id into v_payout_id;

  update public.final_delivery_orders
  set traveler_payout_eligible = true,
      payout_blocked_reason = null,
      updated_at = now()
  where id = v_order.id;

  update public.shipments
  set payout_eligible_for_release = true,
      payout_blocked_reason = null
  where id = v_order.shipment_id;

  insert into public.payout_release_events (
    shipment_id,
    final_delivery_order_id,
    beneficiary_id,
    beneficiary_role,
    eligible,
    blocked_reason,
    idempotency_key,
    payout_id,
    created_by
  )
  values (
    v_order.shipment_id,
    v_order.id,
    v_batch.traveler_id,
    'traveler',
    true,
    null,
    v_key,
    v_payout_id,
    auth.uid()
  )
  on conflict (idempotency_key) do update set
    eligible = true,
    blocked_reason = null,
    payout_id = coalesce(public.payout_release_events.payout_id, excluded.payout_id)
  returning id into v_event_id;

  perform public.enqueue_final_delivery_notification(
    v_order.shipment_id,
    v_order.id,
    'traveler_payout_releasable',
    'Payout voyageur liberable',
    'Le lot destination a ete controle sans anomalie bloquante.',
    v_batch.traveler_id,
    '{}'::jsonb,
    '/dashboard/traveler/assignments',
    jsonb_build_object('payout_id', v_payout_id, 'provider', 'manual_sandbox')
  );

  return v_event_id;
end;
$$;

create or replace function public.confirm_destination_batch_reception(
  p_batch_id uuid,
  p_relay_point_id uuid default null,
  p_note text default null,
  p_default_delivery_mode public.final_delivery_mode default 'relay_pickup'
)
returns table (
  order_id uuid,
  shipment_id uuid,
  status public.final_delivery_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_order_id uuid;
  v_delivery_address record;
  v_status public.final_delivery_status;
begin
  perform public.assert_final_delivery_staff();

  update public.hub_batches
  set status = 'arrived',
      updated_at = now()
  where id = p_batch_id;

  if not found then
    raise exception 'Batch not found';
  end if;

  update public.capacity_reservations
  set status = 'released',
      updated_at = now()
  where batch_id = p_batch_id
    and status in ('reserved', 'loaded');

  for v_row in
    select cr.shipment_id, s.tracking_code, s.sender_id, s.estimated_price_cents, s.currency
    from public.capacity_reservations cr
    join public.shipments s on s.id = cr.shipment_id
    where cr.batch_id = p_batch_id
  loop
    select
      contact_name,
      contact_phone,
      contact_email
    into v_delivery_address
    from public.shipment_addresses
    where shipment_id = v_row.shipment_id
      and type = 'delivery'
    limit 1;

    v_status := case
      when p_default_delivery_mode = 'home_delivery' then 'awaiting_final_delivery'::public.final_delivery_status
      else 'awaiting_recipient_pickup'::public.final_delivery_status
    end;

    insert into public.final_delivery_orders (
      shipment_id,
      batch_id,
      destination_relay_point_id,
      delivery_mode,
      status,
      storage_location,
      recipient_name,
      recipient_phone_last4,
      recipient_email,
      pickup_deadline_at,
      traveler_payout_eligible,
      created_by,
      updated_by
    )
    values (
      v_row.shipment_id,
      p_batch_id,
      p_relay_point_id,
      p_default_delivery_mode,
      v_status,
      'DEST-' || upper(substr(v_row.tracking_code, 5, 4)),
      v_delivery_address.contact_name,
      right(regexp_replace(coalesce(v_delivery_address.contact_phone, ''), '\D', '', 'g'), 4),
      v_delivery_address.contact_email,
      now() + interval '14 days',
      true,
      auth.uid(),
      auth.uid()
    )
    on conflict (shipment_id) do update set
      batch_id = excluded.batch_id,
      destination_relay_point_id = coalesce(excluded.destination_relay_point_id, public.final_delivery_orders.destination_relay_point_id),
      delivery_mode = coalesce(public.final_delivery_orders.delivery_mode, excluded.delivery_mode),
      status = excluded.status,
      storage_location = coalesce(public.final_delivery_orders.storage_location, excluded.storage_location),
      recipient_name = coalesce(public.final_delivery_orders.recipient_name, excluded.recipient_name),
      recipient_phone_last4 = coalesce(public.final_delivery_orders.recipient_phone_last4, excluded.recipient_phone_last4),
      recipient_email = coalesce(public.final_delivery_orders.recipient_email, excluded.recipient_email),
      pickup_deadline_at = coalesce(public.final_delivery_orders.pickup_deadline_at, excluded.pickup_deadline_at),
      traveler_payout_eligible = true,
      payout_blocked_reason = null,
      last_event_at = now(),
      updated_by = auth.uid(),
      updated_at = now()
    returning id into v_order_id;

    if p_relay_point_id is not null then
      insert into public.relay_inventory (
        shipment_id,
        current_relay_point_id,
        status,
        checked_in_at,
        checked_out_at,
        updated_by
      )
      values (
        v_row.shipment_id,
        p_relay_point_id,
        'stored',
        now(),
        null,
        auth.uid()
      )
      on conflict (shipment_id) do update set
        current_relay_point_id = excluded.current_relay_point_id,
        status = 'stored',
        checked_in_at = coalesce(public.relay_inventory.checked_in_at, now()),
        checked_out_at = null,
        updated_by = auth.uid(),
        updated_at = now();
    end if;

    insert into public.destination_package_checks (
      final_delivery_order_id,
      batch_id,
      shipment_id,
      relay_point_id,
      checked_by,
      status,
      package_condition,
      storage_location,
      note
    )
    values (
      v_order_id,
      p_batch_id,
      v_row.shipment_id,
      p_relay_point_id,
      auth.uid(),
      'destination_package_confirmed',
      'conforme',
      'DEST-' || upper(substr(v_row.tracking_code, 5, 4)),
      coalesce(p_note, 'Colis confirme au relais destination.')
    );

    update public.shipments
    set status = 'out_for_delivery',
        payout_eligible_for_release = true,
        payout_blocked_reason = null
    where id = v_row.shipment_id;

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    values (
      v_row.shipment_id,
      auth.uid(),
      'out_for_delivery',
      coalesce(p_note, 'Colis recu au relais destination, en attente de remise finale.'),
      jsonb_build_object('batch_id', p_batch_id, 'final_delivery_order_id', v_order_id)
    );

    perform public.record_final_delivery_event(
      v_row.shipment_id,
      v_order_id,
      'destination_batch_received',
      'destination_batch_received',
      coalesce(p_note, 'Lot recu au relais destination.'),
      jsonb_build_object('batch_id', p_batch_id, 'relay_point_id', p_relay_point_id)
    );

    perform public.record_final_delivery_event(
      v_row.shipment_id,
      v_order_id,
      v_status,
      'recipient_choice_defaulted',
      'Mode de remise destination initialise.',
      jsonb_build_object('delivery_mode', p_default_delivery_mode)
    );

    perform public.enqueue_final_delivery_notification(
      v_row.shipment_id,
      v_order_id,
      'destination_received',
      'Colis arrive au relais destination',
      'Votre colis ' || v_row.tracking_code || ' est arrive au relais destination.',
      v_row.sender_id,
      jsonb_build_object('recipient_email', v_delivery_address.contact_email),
      '/dashboard/client/shipments/' || v_row.shipment_id::text,
      jsonb_build_object('tracking_code', v_row.tracking_code)
    );

    perform public.release_traveler_payout_if_eligible(v_order_id);

    order_id := v_order_id;
    shipment_id := v_row.shipment_id;
    status := v_status;
    return next;
  end loop;
end;
$$;

create or replace function public.set_final_delivery_choice(
  p_shipment_id uuid,
  p_delivery_mode public.final_delivery_mode,
  p_reason text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.final_delivery_orders%rowtype;
  v_next_status public.final_delivery_status;
  v_old jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order
  from public.final_delivery_orders
  where shipment_id = p_shipment_id
  for update;

  if v_order.id is null then
    raise exception 'Final delivery order not found';
  end if;

  if not (
    public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
    or exists (select 1 from public.shipments s where s.id = p_shipment_id and s.sender_id = auth.uid())
  ) then
    raise exception 'Not allowed to change delivery choice';
  end if;

  v_old := jsonb_build_object('delivery_mode', v_order.delivery_mode, 'status', v_order.status);
  v_next_status := case
    when p_delivery_mode = 'home_delivery' then 'awaiting_final_delivery'::public.final_delivery_status
    else 'awaiting_recipient_pickup'::public.final_delivery_status
  end;

  update public.final_delivery_orders
  set delivery_mode = p_delivery_mode,
      status = v_next_status,
      updated_by = auth.uid(),
      last_event_at = now(),
      updated_at = now()
  where id = v_order.id;

  perform public.record_final_delivery_event(
    p_shipment_id,
    v_order.id,
    v_next_status,
    'delivery_choice_changed',
    coalesce(p_reason, 'Mode de remise final selectionne.'),
    jsonb_build_object('delivery_mode', p_delivery_mode)
  );

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'final_delivery.choice_changed',
    'final_delivery_order',
    v_order.id,
    jsonb_build_object('old', v_old, 'new', jsonb_build_object('delivery_mode', p_delivery_mode, 'status', v_next_status), 'reason', p_reason)
  );

  return v_order.id;
end;
$$;

create or replace function public.generate_delivery_otp(
  p_shipment_id uuid,
  p_delivery_mode public.final_delivery_mode,
  p_ttl_minutes integer default 15,
  p_channel text default 'in_app'
)
returns table (
  otp_id uuid,
  otp_code text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
declare
  v_order public.final_delivery_orders%rowtype;
  v_existing public.delivery_otps%rowtype;
  v_salt text;
  v_code text;
  v_hash text;
  v_number bigint;
  v_bytes bytea;
  v_expires_at timestamptz;
  v_resend_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order
  from public.final_delivery_orders
  where shipment_id = p_shipment_id
  for update;

  if v_order.id is null then
    raise exception 'Final delivery order not found';
  end if;

  if not (
    public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
    or exists (select 1 from public.shipments s where s.id = p_shipment_id and s.sender_id = auth.uid())
    or exists (
      select 1
      from public.local_delivery_missions m
      where m.id = v_order.final_delivery_mission_id
        and m.transporter_id = auth.uid()
    )
  ) then
    raise exception 'Not allowed to generate delivery OTP';
  end if;

  select * into v_existing
  from public.delivery_otps
  where shipment_id = p_shipment_id
    and delivery_mode = p_delivery_mode
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    if v_existing.resend_count >= 3 then
      raise exception 'OTP resend limit reached';
    end if;

    v_resend_count := v_existing.resend_count + 1;

    update public.delivery_otps
    set status = 'revoked',
        revoked_at = coalesce(revoked_at, now()),
        updated_at = now()
    where shipment_id = p_shipment_id
      and delivery_mode = p_delivery_mode
      and status = 'active';
  end if;

  v_bytes := gen_random_bytes(4);
  v_number := (
    get_byte(v_bytes, 0)::bigint * 16777216
    + get_byte(v_bytes, 1)::bigint * 65536
    + get_byte(v_bytes, 2)::bigint * 256
    + get_byte(v_bytes, 3)::bigint
  ) % 1000000;
  v_code := lpad(v_number::text, 6, '0');
  v_salt := encode(gen_random_bytes(16), 'hex');
  v_hash := public.hash_delivery_otp(v_code, v_salt);
  v_expires_at := now() + make_interval(mins => greatest(5, least(coalesce(p_ttl_minutes, 15), 60)));

  insert into public.delivery_otps (
    shipment_id,
    final_delivery_order_id,
    recipient_id,
    delivery_mode,
    relay_point_id,
    mission_id,
    code_hash,
    salt,
    status,
    expires_at,
    resend_count,
    last_sent_channel,
    created_by
  )
  values (
    p_shipment_id,
    v_order.id,
    v_order.recipient_id,
    p_delivery_mode,
    v_order.destination_relay_point_id,
    v_order.final_delivery_mission_id,
    v_hash,
    v_salt,
    'active',
    v_expires_at,
    v_resend_count,
    p_channel,
    auth.uid()
  )
  returning id into otp_id;

  insert into public.otp_events (otp_id, shipment_id, actor_id, event_type, metadata)
  values (
    otp_id,
    p_shipment_id,
    auth.uid(),
    case when v_resend_count > 0 then 'otp_resend' else 'otp_generated' end,
    jsonb_build_object('delivery_mode', p_delivery_mode, 'expires_at', v_expires_at, 'channel', p_channel)
  );

  perform public.enqueue_final_delivery_notification(
    p_shipment_id,
    v_order.id,
    case when v_resend_count > 0 then 'otp_resend' else 'otp_generated' end,
    case when v_resend_count > 0 then 'OTP renouvele' else 'OTP genere' end,
    'Un OTP a usage unique a ete genere pour la remise finale.',
    null,
    jsonb_build_object('recipient_email', v_order.recipient_email),
    '/recipient/delivery/' || p_shipment_id::text,
    jsonb_build_object('tracking_delivery_mode', p_delivery_mode, 'provider', 'sandbox_or_in_app')
  );

  otp_code := v_code;
  expires_at := v_expires_at;
  return next;
end;
$$;

create or replace function public.revoke_delivery_otp(
  p_otp_id uuid,
  p_reason text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_otp public.delivery_otps%rowtype;
begin
  perform public.assert_final_delivery_staff();

  select * into v_otp
  from public.delivery_otps
  where id = p_otp_id
  for update;

  if v_otp.id is null then
    raise exception 'OTP not found';
  end if;

  update public.delivery_otps
  set status = 'revoked',
      revoked_at = now(),
      updated_at = now()
  where id = p_otp_id;

  insert into public.otp_events (otp_id, shipment_id, actor_id, event_type, metadata)
  values (
    p_otp_id,
    v_otp.shipment_id,
    auth.uid(),
    'otp_revoked',
    jsonb_build_object('reason', p_reason)
  );

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'delivery_otp.revoked',
    'delivery_otp',
    p_otp_id,
    jsonb_build_object('reason', p_reason, 'shipment_id', v_otp.shipment_id)
  );

  return p_otp_id;
end;
$$;

create or replace function public.verify_delivery_otp(
  p_shipment_id uuid,
  p_delivery_mode public.final_delivery_mode,
  p_otp_code text,
  p_mission_id uuid default null,
  p_recipient_name text default null,
  p_recipient_phone_last4 text default null,
  p_signature_path text default null,
  p_photo_path text default null,
  p_note text default null
)
returns table (
  verified boolean,
  proof_id uuid,
  order_id uuid,
  status public.final_delivery_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_otp public.delivery_otps%rowtype;
  v_order public.final_delivery_orders%rowtype;
  v_shipment public.shipments%rowtype;
  v_hash text;
  v_failure text;
  v_delivery_proof_id uuid;
  v_proof_id uuid;
  v_driver_id uuid;
  v_payout_id uuid;
  v_release_key text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order
  from public.final_delivery_orders
  where shipment_id = p_shipment_id
  for update;

  if v_order.id is null then
    raise exception 'Final delivery order not found';
  end if;

  select * into v_shipment from public.shipments where id = p_shipment_id;

  select * into v_otp
  from public.delivery_otps
  where shipment_id = p_shipment_id
    and delivery_mode = p_delivery_mode
    and status = 'active'
    and (p_mission_id is null or mission_id = p_mission_id or mission_id is null)
  order by created_at desc
  limit 1
  for update;

  if v_otp.id is null then
    insert into public.otp_attempts (shipment_id, attempted_by, success, failure_reason)
    values (p_shipment_id, auth.uid(), false, 'no_active_otp');
    raise exception 'No active OTP';
  end if;

  if v_otp.blocked_until is not null and v_otp.blocked_until > now() then
    v_failure := 'temporarily_blocked';
  elsif v_otp.expires_at <= now() then
    v_failure := 'expired';
  elsif length(coalesce(p_otp_code, '')) <> 6 then
    v_failure := 'invalid_format';
  else
    v_hash := public.hash_delivery_otp(p_otp_code, v_otp.salt);
    if v_hash <> v_otp.code_hash then
      v_failure := 'invalid_code';
    end if;
  end if;

  if v_failure is not null then
    update public.delivery_otps
    set attempt_count = attempt_count + 1,
        status = case when v_failure = 'expired' then 'expired' else status end,
        blocked_until = case
          when attempt_count + 1 >= max_attempts then now() + interval '15 minutes'
          else blocked_until
        end,
        updated_at = now()
    where id = v_otp.id;

    insert into public.otp_attempts (otp_id, shipment_id, attempted_by, success, failure_reason)
    values (v_otp.id, p_shipment_id, auth.uid(), false, v_failure);

    insert into public.otp_events (otp_id, shipment_id, actor_id, event_type, metadata)
    values (v_otp.id, p_shipment_id, auth.uid(), 'otp_failed', jsonb_build_object('reason', v_failure));

    perform public.record_final_delivery_event(
      p_shipment_id,
      v_order.id,
      'otp_failed',
      'otp_failed',
      'Validation OTP refusee.',
      jsonb_build_object('reason', v_failure)
    );

    verified := false;
    proof_id := null;
    order_id := v_order.id;
    status := 'otp_failed';
    return next;
    return;
  end if;

  update public.delivery_otps
  set status = 'used',
      used_at = now(),
      attempt_count = attempt_count + 1,
      updated_at = now()
  where id = v_otp.id;

  insert into public.otp_attempts (otp_id, shipment_id, attempted_by, success, failure_reason)
  values (v_otp.id, p_shipment_id, auth.uid(), true, null);

  insert into public.otp_events (otp_id, shipment_id, actor_id, event_type, metadata)
  values (v_otp.id, p_shipment_id, auth.uid(), 'otp_verified', jsonb_build_object('delivery_mode', p_delivery_mode));

  insert into public.delivery_proofs (
    shipment_id,
    mission_id,
    uploaded_by,
    proof_type,
    storage_bucket,
    storage_path,
    otp_confirmed,
    recipient_name,
    recipient_phone_last4,
    metadata
  )
  values (
    p_shipment_id,
    coalesce(p_mission_id, v_order.final_delivery_mission_id),
    auth.uid(),
    'otp',
    case when nullif(p_photo_path, '') is not null then 'proof-of-delivery' else null end,
    nullif(p_photo_path, ''),
    true,
    nullif(p_recipient_name, ''),
    nullif(p_recipient_phone_last4, ''),
    jsonb_build_object('final_delivery_order_id', v_order.id, 'otp_id', v_otp.id, 'delivery_mode', p_delivery_mode)
  )
  returning id into v_delivery_proof_id;

  insert into public.proof_of_delivery (
    shipment_id,
    final_delivery_order_id,
    mission_id,
    delivery_proof_id,
    recorded_by,
    method,
    recipient_id,
    recipient_name,
    recipient_phone_last4,
    location_label,
    public_summary,
    private_metadata
  )
  values (
    p_shipment_id,
    v_order.id,
    coalesce(p_mission_id, v_order.final_delivery_mission_id),
    v_delivery_proof_id,
    auth.uid(),
    'otp',
    v_order.recipient_id,
    coalesce(nullif(p_recipient_name, ''), v_order.recipient_name),
    coalesce(nullif(p_recipient_phone_last4, ''), v_order.recipient_phone_last4),
    case when p_delivery_mode = 'home_delivery' then 'Adresse destinataire' else 'Point relais destination' end,
    jsonb_build_object(
      'delivered', true,
      'method', 'otp',
      'delivered_at', now(),
      'location', case when p_delivery_mode = 'home_delivery' then 'destination_area' else 'destination_relay' end
    ),
    jsonb_build_object('otp_id', v_otp.id, 'note', p_note)
  )
  returning id into v_proof_id;

  if nullif(p_signature_path, '') is not null then
    insert into public.delivery_signatures (proof_of_delivery_id, signer_name, signature_path, signature_hash)
    values (
      v_proof_id,
      coalesce(nullif(p_recipient_name, ''), v_order.recipient_name, 'Destinataire'),
      p_signature_path,
      encode(digest(p_signature_path || ':' || v_proof_id::text, 'sha256'), 'hex')
    );
  end if;

  if nullif(p_photo_path, '') is not null then
    insert into public.delivery_photos (proof_of_delivery_id, storage_bucket, storage_path, purpose)
    values (v_proof_id, 'proof-of-delivery', p_photo_path, 'delivery_proof');
  end if;

  insert into public.proof_of_delivery_summaries (
    proof_of_delivery_id,
    shipment_id,
    sender_id,
    method,
    delivered_at,
    location_label,
    recipient_label,
    summary
  )
  values (
    v_proof_id,
    p_shipment_id,
    v_shipment.sender_id,
    'otp',
    now(),
    case when p_delivery_mode = 'home_delivery' then 'Zone de destination' else 'Point relais destination' end,
    case
      when coalesce(nullif(p_recipient_name, ''), v_order.recipient_name) is null then null
      else left(coalesce(nullif(p_recipient_name, ''), v_order.recipient_name), 1) || '***'
    end,
    jsonb_build_object('delivered', true, 'method', 'otp', 'proof_available', true)
  )
  on conflict (proof_of_delivery_id) do nothing;

  update public.final_delivery_orders
  set status = 'delivered',
      delivered_at = now(),
      final_driver_payout_eligible = case when p_delivery_mode = 'home_delivery' then true else final_driver_payout_eligible end,
      payout_blocked_reason = null,
      last_event_at = now(),
      updated_by = auth.uid(),
      updated_at = now()
  where id = v_order.id;

  update public.shipments
  set status = 'delivered',
      delivery_otp_confirmed_at = now(),
      proof_of_delivery_path = coalesce(nullif(p_photo_path, ''), proof_of_delivery_path),
      payout_eligible_for_release = true,
      payout_blocked_reason = null
  where id = p_shipment_id;

  insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
  values (
    p_shipment_id,
    auth.uid(),
    'delivered',
    coalesce(p_note, 'Remise finale confirmee par OTP.'),
    jsonb_build_object('final_delivery_order_id', v_order.id, 'proof_of_delivery_id', v_proof_id)
  );

  perform public.record_final_delivery_event(
    p_shipment_id,
    v_order.id,
    'delivered',
    'delivery_completed',
    coalesce(p_note, 'Remise finale confirmee.'),
    jsonb_build_object('proof_of_delivery_id', v_proof_id, 'delivery_proof_id', v_delivery_proof_id)
  );

  if p_delivery_mode = 'home_delivery' and coalesce(p_mission_id, v_order.final_delivery_mission_id) is not null then
    update public.local_delivery_missions
    set status = 'delivered',
        delivered_at = now(),
        payout_eligible_for_release = true,
        payout_blocked_reason = null,
        payout_release_at = now(),
        updated_at = now()
    where id = coalesce(p_mission_id, v_order.final_delivery_mission_id)
    returning transporter_id into v_driver_id;

    v_release_key := 'final_driver:' || p_shipment_id::text || ':' || coalesce(p_mission_id, v_order.final_delivery_mission_id)::text;

    insert into public.payouts (
      beneficiary_id,
      shipment_id,
      amount_cents,
      currency,
      status,
      scheduled_for,
      metadata
    )
    select
      v_driver_id,
      p_shipment_id,
      greatest((v_shipment.estimated_price_cents / 4)::integer, 100),
      v_shipment.currency,
      'pending',
      current_date + 1,
      jsonb_build_object('source', 'final_mile_delivery', 'mission_id', coalesce(p_mission_id, v_order.final_delivery_mission_id), 'proof_id', v_proof_id)
    where v_driver_id is not null
      and not exists (
        select 1
        from public.payouts p
        where p.shipment_id = p_shipment_id
          and p.beneficiary_id = v_driver_id
          and p.metadata->>'source' = 'final_mile_delivery'
      )
    returning id into v_payout_id;

    insert into public.payout_release_events (
      shipment_id,
      final_delivery_order_id,
      beneficiary_id,
      beneficiary_role,
      eligible,
      idempotency_key,
      payout_id,
      created_by
    )
    values (
      p_shipment_id,
      v_order.id,
      v_driver_id,
      'final_driver',
      true,
      v_release_key,
      v_payout_id,
      auth.uid()
    )
    on conflict (idempotency_key) do update set
      eligible = true,
      payout_id = coalesce(public.payout_release_events.payout_id, excluded.payout_id);
  end if;

  perform public.enqueue_final_delivery_notification(
    p_shipment_id,
    v_order.id,
    'final_delivery_completed',
    'Colis livre',
    'La remise finale du colis ' || v_shipment.tracking_code || ' est confirmee.',
    v_shipment.sender_id,
    jsonb_build_object('recipient_email', v_order.recipient_email),
    '/dashboard/client/shipments/' || p_shipment_id::text,
    jsonb_build_object('proof_of_delivery_id', v_proof_id)
  );

  verified := true;
  proof_id := v_proof_id;
  order_id := v_order.id;
  status := 'delivered';
  return next;
end;
$$;

create or replace function public.create_final_mile_delivery_mission(
  p_shipment_id uuid,
  p_transporter_id uuid default null,
  p_note text default null
) returns table (
  mission_id uuid,
  transporter_id uuid,
  status public.local_delivery_mission_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.final_delivery_orders%rowtype;
  v_transporter_id uuid;
  v_mission_id uuid;
begin
  perform public.assert_final_delivery_staff();

  select * into v_order
  from public.final_delivery_orders
  where shipment_id = p_shipment_id
  for update;

  if v_order.id is null then
    raise exception 'Final delivery order not found';
  end if;

  v_transporter_id := p_transporter_id;

  if v_transporter_id is null then
    select tp.profile_id
    into v_transporter_id
    from public.transporter_profiles tp
    left join public.local_delivery_missions m
      on m.transporter_id = tp.profile_id
     and m.status in ('offered', 'accepted', 'picked_up')
    where tp.status = 'active'
      and m.id is null
    order by tp.rating desc, tp.completed_missions desc, tp.updated_at desc
    limit 1;
  end if;

  if v_transporter_id is null then
    raise exception 'No available final-mile transporter found';
  end if;

  insert into public.local_delivery_missions (
    shipment_id,
    transporter_id,
    status,
    score,
    reason,
    offered_at,
    mission_type,
    final_delivery_order_id
  )
  values (
    p_shipment_id,
    v_transporter_id,
    'offered',
    100,
    array['relay_to_recipient', coalesce(p_note, 'Mission finale destination')],
    now(),
    'relay_to_recipient',
    v_order.id
  )
  on conflict (shipment_id, transporter_id) do update set
    status = case
      when public.local_delivery_missions.status in ('accepted', 'picked_up', 'delivered') then public.local_delivery_missions.status
      else 'offered'::public.local_delivery_mission_status
    end,
    mission_type = 'relay_to_recipient',
    final_delivery_order_id = excluded.final_delivery_order_id,
    offered_at = coalesce(public.local_delivery_missions.offered_at, excluded.offered_at),
    updated_at = now()
  returning id into v_mission_id;

  update public.final_delivery_orders
  set delivery_mode = 'home_delivery',
      status = 'delivery_assigned',
      final_delivery_mission_id = v_mission_id,
      updated_by = auth.uid(),
      updated_at = now()
  where id = v_order.id;

  perform public.record_final_delivery_event(
    p_shipment_id,
    v_order.id,
    'delivery_assigned',
    'final_mile_mission_created',
    coalesce(p_note, 'Mission finale creee pour livraison a domicile.'),
    jsonb_build_object('mission_id', v_mission_id, 'transporter_id', v_transporter_id)
  );

  perform public.enqueue_final_delivery_notification(
    p_shipment_id,
    v_order.id,
    'final_delivery_scheduled',
    'Nouvelle mission finale',
    'Une livraison finale a domicile est disponible.',
    v_transporter_id,
    '{}'::jsonb,
    '/dashboard/transporter/missions/' || v_mission_id::text,
    jsonb_build_object('mission_id', v_mission_id)
  );

  mission_id := v_mission_id;
  transporter_id := v_transporter_id;
  status := 'offered';
  return next;
end;
$$;

create or replace function public.record_final_delivery_attempt(
  p_shipment_id uuid,
  p_status public.final_delivery_status,
  p_note text,
  p_rescheduled_for timestamptz default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.final_delivery_orders%rowtype;
  v_event_id uuid;
begin
  if p_status not in (
    'delivery_attempted',
    'recipient_absent',
    'invalid_address',
    'delivery_rescheduled',
    'returned_to_relay',
    'refused_by_recipient',
    'delivery_blocked',
    'return_requested'
  ) then
    raise exception 'Unsupported delivery attempt status';
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order
  from public.final_delivery_orders
  where shipment_id = p_shipment_id
  for update;

  if v_order.id is null then
    raise exception 'Final delivery order not found';
  end if;

  if not (
    public.current_user_has_role(array['relay_agent', 'relay_manager', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
    or exists (
      select 1
      from public.local_delivery_missions m
      where m.id = v_order.final_delivery_mission_id
        and m.transporter_id = auth.uid()
    )
  ) then
    raise exception 'Not allowed to record delivery attempt';
  end if;

  update public.final_delivery_orders
  set status = p_status,
      payout_blocked_reason = case when p_status in ('delivery_blocked', 'refused_by_recipient', 'return_requested') then p_status::text else payout_blocked_reason end,
      anomaly_count = case when p_status in ('delivery_blocked', 'refused_by_recipient', 'return_requested') then anomaly_count + 1 else anomaly_count end,
      updated_by = auth.uid(),
      last_event_at = now(),
      updated_at = now()
  where id = v_order.id;

  if p_status in ('delivery_blocked', 'refused_by_recipient', 'return_requested') then
    update public.shipments
    set payout_eligible_for_release = false,
        payout_blocked_reason = p_status::text
    where id = p_shipment_id;
  end if;

  v_event_id := public.record_final_delivery_event(
    p_shipment_id,
    v_order.id,
    p_status,
    'delivery_attempt_recorded',
    p_note,
    jsonb_build_object('rescheduled_for', p_rescheduled_for)
  );

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'final_delivery.attempt_recorded',
    'final_delivery_order',
    v_order.id,
    jsonb_build_object('status', p_status, 'note', p_note, 'rescheduled_for', p_rescheduled_for)
  );

  return v_event_id;
end;
$$;

create or replace function public.create_manual_correction(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_permission_key text,
  p_old_value jsonb,
  p_new_value jsonb,
  p_reason text,
  p_comment text,
  p_requires_second_approval boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correction_id uuid;
  v_status public.manual_correction_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.current_user_has_role(array['operations_manager', 'support_agent', 'finance_agent', 'admin', 'super_admin']) then
    raise exception 'Insufficient manual correction permissions';
  end if;

  v_status := case when p_requires_second_approval then 'requested'::public.manual_correction_status else 'approved'::public.manual_correction_status end;

  insert into public.manual_corrections (
    entity_type,
    entity_id,
    action,
    permission_key,
    old_value,
    new_value,
    reason,
    comment,
    status,
    requires_second_approval,
    requested_by,
    approved_by,
    request_context
  )
  values (
    p_entity_type,
    p_entity_id,
    p_action,
    p_permission_key,
    coalesce(p_old_value, '{}'::jsonb),
    coalesce(p_new_value, '{}'::jsonb),
    p_reason,
    p_comment,
    v_status,
    p_requires_second_approval,
    auth.uid(),
    case when p_requires_second_approval then null else auth.uid() end,
    jsonb_build_object('source', 'app_api', 'at', now())
  )
  returning id into v_correction_id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'manual_correction.created',
    p_entity_type,
    p_entity_id,
    jsonb_build_object('manual_correction_id', v_correction_id, 'action', p_action, 'permission_key', p_permission_key, 'status', v_status)
  );

  return v_correction_id;
end;
$$;

create or replace function public.admin_manual_delivery_override(
  p_shipment_id uuid,
  p_new_status public.final_delivery_status,
  p_reason text,
  p_comment text,
  p_force_delivered boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.final_delivery_orders%rowtype;
  v_correction_id uuid;
  v_proof_id uuid;
  v_delivery_proof_id uuid;
begin
  if not public.current_user_has_role(array['operations_manager', 'admin', 'super_admin']) then
    raise exception 'Insufficient override permissions';
  end if;

  select * into v_order
  from public.final_delivery_orders
  where shipment_id = p_shipment_id
  for update;

  if v_order.id is null then
    raise exception 'Final delivery order not found';
  end if;

  v_correction_id := public.create_manual_correction(
    'final_delivery_order',
    v_order.id,
    case when p_force_delivered then 'mark_delivered_manually' else 'change_final_delivery_status' end,
    'delivery.override',
    jsonb_build_object('status', v_order.status, 'delivered_at', v_order.delivered_at),
    jsonb_build_object('status', p_new_status, 'force_delivered', p_force_delivered),
    p_reason,
    p_comment,
    p_force_delivered
  );

  update public.final_delivery_orders
  set status = p_new_status,
      delivered_at = case when p_force_delivered or p_new_status = 'delivered' then now() else delivered_at end,
      payout_blocked_reason = case when p_force_delivered then null else payout_blocked_reason end,
      updated_by = auth.uid(),
      last_event_at = now(),
      updated_at = now()
  where id = v_order.id;

  if p_force_delivered or p_new_status = 'delivered' then
    insert into public.delivery_proofs (
      shipment_id,
      uploaded_by,
      proof_type,
      otp_confirmed,
      recipient_name,
      recipient_phone_last4,
      metadata
    )
    values (
      p_shipment_id,
      auth.uid(),
      'document',
      false,
      v_order.recipient_name,
      v_order.recipient_phone_last4,
      jsonb_build_object('method', 'manual_override', 'manual_correction_id', v_correction_id, 'reason', p_reason)
    )
    returning id into v_delivery_proof_id;

    insert into public.proof_of_delivery (
      shipment_id,
      final_delivery_order_id,
      delivery_proof_id,
      recorded_by,
      method,
      recipient_name,
      recipient_phone_last4,
      location_label,
      public_summary,
      private_metadata
    )
    values (
      p_shipment_id,
      v_order.id,
      v_delivery_proof_id,
      auth.uid(),
      'manual_override',
      v_order.recipient_name,
      v_order.recipient_phone_last4,
      'Correction administrative',
      jsonb_build_object('delivered', true, 'method', 'manual_override', 'delivered_at', now()),
      jsonb_build_object('manual_correction_id', v_correction_id, 'reason', p_reason, 'comment', p_comment)
    )
    returning id into v_proof_id;

    insert into public.proof_of_delivery_summaries (
      proof_of_delivery_id,
      shipment_id,
      sender_id,
      method,
      delivered_at,
      location_label,
      recipient_label,
      summary
    )
    select
      v_proof_id,
      p_shipment_id,
      s.sender_id,
      'manual_override',
      now(),
      'Correction administrative',
      case when v_order.recipient_name is null then null else left(v_order.recipient_name, 1) || '***' end,
      jsonb_build_object('delivered', true, 'method', 'manual_override', 'proof_available', true)
    from public.shipments s
    where s.id = p_shipment_id
    on conflict (proof_of_delivery_id) do nothing;

    update public.shipments
    set status = 'delivered',
        payout_eligible_for_release = true,
        payout_blocked_reason = null,
        delivery_otp_confirmed_at = coalesce(delivery_otp_confirmed_at, now())
    where id = p_shipment_id;

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    values (
      p_shipment_id,
      auth.uid(),
      'delivered',
      p_comment,
      jsonb_build_object('manual_correction_id', v_correction_id, 'proof_of_delivery_id', v_proof_id)
    );
  end if;

  perform public.record_final_delivery_event(
    p_shipment_id,
    v_order.id,
    p_new_status,
    'admin_manual_override',
    p_comment,
    jsonb_build_object('manual_correction_id', v_correction_id, 'force_delivered', p_force_delivered)
  );

  return v_correction_id;
end;
$$;

drop function if exists public.scan_handover_qr_token(text, public.handover_qr_token_type, text, text);

create or replace function public.scan_handover_qr_token(
  p_token text,
  p_expected_token_type public.handover_qr_token_type,
  p_note text default null,
  p_incident_type text default null,
  p_relay_point_id uuid default null
)
returns table (
  batch_id uuid,
  next_token text,
  next_token_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = public, extensions, pg_catalog
as $$
declare
  v_token public.handover_qr_tokens%rowtype;
  v_next record;
  v_order record;
  v_incident_status public.final_delivery_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_token
  from public.handover_qr_tokens
  where token_hash = public.hash_handover_token(p_token)
  for update;

  if v_token.id is null then
    raise exception 'QR token not found';
  end if;

  if v_token.token_type <> p_expected_token_type then
    raise exception 'Unexpected QR token type';
  end if;

  if v_token.status <> 'active' or v_token.expires_at <= now() then
    update public.handover_qr_tokens
    set status = case when expires_at <= now() then 'expired' else status end,
        updated_at = now()
    where id = v_token.id;
    raise exception 'QR token is not active';
  end if;

  update public.handover_qr_tokens
  set status = 'used',
      used_by = auth.uid(),
      used_at = now(),
      updated_at = now()
  where id = v_token.id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'qr_token_scanned',
    'hub_batch',
    v_token.batch_id,
    jsonb_build_object(
      'token_id',
      v_token.id,
      'token_type',
      v_token.token_type,
      'incident_type',
      nullif(p_incident_type, ''),
      'relay_point_id',
      p_relay_point_id
    )
  );

  if p_expected_token_type = 'origin_pickup' then
    update public.hub_batches
    set status = 'in_transit',
        sealed_by = coalesce(sealed_by, auth.uid()),
        sealed_at = coalesce(sealed_at, now())
    where id = v_token.batch_id;

    update public.capacity_reservations cr
    set status = 'loaded',
        updated_at = now()
    where cr.batch_id = v_token.batch_id
      and cr.status = 'reserved';

    update public.shipments s
    set status = 'in_transit'
    where s.id in (
      select cr.shipment_id
      from public.capacity_reservations cr
      where cr.batch_id = v_token.batch_id
    );

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    select
      cr.shipment_id,
      auth.uid(),
      'in_transit',
      coalesce(p_note, 'Lot remis au voyageur.'),
      jsonb_build_object('batch_id', v_token.batch_id, 'qr_token_id', v_token.id)
    from public.capacity_reservations cr
    where cr.batch_id = v_token.batch_id;

    select *
    into v_next
    from public.create_handover_qr_token(v_token.batch_id, 'destination_dropoff', 240)
    limit 1;

    batch_id := v_token.batch_id;
    next_token := v_next.token;
    next_token_expires_at := v_next.expires_at;
    return next;
  else
    for v_order in
      select *
      from public.confirm_destination_batch_reception(
        v_token.batch_id,
        p_relay_point_id,
        coalesce(p_note, 'Lot receptionne a destination.'),
        'relay_pickup'
      )
    loop
      if nullif(p_incident_type, '') is not null then
        v_incident_status := case
          when p_incident_type = 'missing_package' then 'destination_package_missing'::public.final_delivery_status
          when p_incident_type = 'damaged_package' then 'destination_package_damaged'::public.final_delivery_status
          else 'delivery_blocked'::public.final_delivery_status
        end;

        update public.final_delivery_orders
        set status = v_incident_status,
            anomaly_count = anomaly_count + 1,
            traveler_payout_eligible = false,
            payout_blocked_reason = p_incident_type,
            updated_by = auth.uid(),
            updated_at = now()
        where id = v_order.order_id;

        update public.shipments
        set payout_eligible_for_release = false,
            payout_blocked_reason = p_incident_type
        where id = v_order.shipment_id;

        insert into public.destination_package_checks (
          final_delivery_order_id,
          batch_id,
          shipment_id,
          relay_point_id,
          checked_by,
          status,
          package_condition,
          note
        )
        values (
          v_order.order_id,
          v_token.batch_id,
          v_order.shipment_id,
          p_relay_point_id,
          auth.uid(),
          v_incident_status,
          p_incident_type,
          coalesce(p_note, 'Incident constate a destination.')
        );

        perform public.record_final_delivery_event(
          v_order.shipment_id,
          v_order.order_id,
          v_incident_status,
          'destination_incident',
          coalesce(p_note, 'Incident constate a destination.'),
          jsonb_build_object('incident_type', p_incident_type, 'qr_token_id', v_token.id)
        );
      end if;
    end loop;

    batch_id := v_token.batch_id;
    next_token := null;
    next_token_expires_at := null;
    return next;
  end if;
end;
$$;
