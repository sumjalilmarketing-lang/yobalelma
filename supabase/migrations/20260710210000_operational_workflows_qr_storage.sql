create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'shipment_fulfillment_method') then
    create type public.shipment_fulfillment_method as enum ('pickup', 'relay_dropoff');
  end if;

  if not exists (select 1 from pg_type where typname = 'pickup_request_status') then
    create type public.pickup_request_status as enum (
      'requested',
      'dispatched',
      'accepted',
      'arrived',
      'picked_up',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'handover_qr_token_type') then
    create type public.handover_qr_token_type as enum (
      'origin_pickup',
      'destination_dropoff'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'handover_qr_token_status') then
    create type public.handover_qr_token_status as enum (
      'active',
      'used',
      'revoked',
      'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hub_inspection_decision') then
    create type public.hub_inspection_decision as enum (
      'accepted',
      'damaged',
      'missing',
      'rejected'
    );
  end if;
end $$;

alter table public.shipments
  add column if not exists fulfillment_method public.shipment_fulfillment_method not null default 'pickup',
  add column if not exists package_photo_path text,
  add column if not exists delivery_otp_code text,
  add column if not exists delivery_otp_confirmed_at timestamptz,
  add column if not exists proof_of_delivery_path text,
  add column if not exists payout_eligible_for_release boolean not null default false,
  add column if not exists payout_blocked_reason text,
  add constraint shipments_delivery_otp_format_check
    check (delivery_otp_code is null or delivery_otp_code ~ '^[0-9]{6}$');

alter table public.hub_batches
  add column if not exists trip_id uuid references public.trips(id) on delete set null,
  add column if not exists traveler_id uuid references public.profiles(id) on delete set null;

alter table public.traveler_documents
  add column if not exists extracted_payload jsonb not null default '{}'::jsonb,
  add column if not exists confidence_score numeric(5, 4),
  add column if not exists manual_review_required boolean not null default true,
  add constraint traveler_documents_confidence_check
    check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1));

create table if not exists public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  requested_for date not null,
  status public.pickup_request_status not null default 'requested',
  assigned_transporter_id uuid references public.transporter_profiles(profile_id) on delete set null,
  mission_id uuid references public.local_delivery_missions(id) on delete set null,
  address_snapshot jsonb not null,
  note text,
  requested_at timestamptz not null default now(),
  dispatched_at timestamptz,
  accepted_at timestamptz,
  arrived_at timestamptz,
  picked_up_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_id)
);

create table if not exists public.handover_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  token_type public.handover_qr_token_type not null,
  status public.handover_qr_token_status not null default 'active',
  batch_id uuid not null references public.hub_batches(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  traveler_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  used_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handover_qr_expiry_check check (expires_at > created_at)
);

create table if not exists public.collection_manifests (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.collection_routes(id) on delete cascade,
  code text not null unique check (code ~ '^MAN-[A-Z0-9]{6,12}$'),
  sealed_by uuid references public.profiles(id) on delete set null,
  sealed_at timestamptz,
  delivered_to_hub_at timestamptz,
  incident_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_manifest_items (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references public.collection_manifests(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  incident_note text,
  created_at timestamptz not null default now(),
  unique (manifest_id, shipment_id)
);

create table if not exists public.hub_package_inspections (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  batch_id uuid references public.hub_batches(id) on delete set null,
  inspector_id uuid references public.profiles(id) on delete set null,
  decision public.hub_inspection_decision not null,
  measured_weight_kg numeric(8, 2) check (measured_weight_kg is null or measured_weight_kg > 0),
  storage_location text,
  photo_path text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists pickup_requests_status_idx
  on public.pickup_requests (status, requested_for);
create index if not exists pickup_requests_transporter_idx
  on public.pickup_requests (assigned_transporter_id, status);
create index if not exists handover_qr_tokens_batch_idx
  on public.handover_qr_tokens (batch_id, token_type, status);
create index if not exists handover_qr_tokens_traveler_idx
  on public.handover_qr_tokens (traveler_id, status);
create index if not exists collection_manifests_route_idx
  on public.collection_manifests (route_id, sealed_at);
create index if not exists collection_manifest_items_shipment_idx
  on public.collection_manifest_items (shipment_id);
create index if not exists hub_package_inspections_shipment_idx
  on public.hub_package_inspections (shipment_id, created_at desc);
create index if not exists hub_batches_trip_idx
  on public.hub_batches (trip_id, traveler_id, status);

drop trigger if exists pickup_requests_set_updated_at on public.pickup_requests;
create trigger pickup_requests_set_updated_at
before update on public.pickup_requests
for each row execute function public.set_updated_at();

drop trigger if exists handover_qr_tokens_set_updated_at on public.handover_qr_tokens;
create trigger handover_qr_tokens_set_updated_at
before update on public.handover_qr_tokens
for each row execute function public.set_updated_at();

drop trigger if exists collection_manifests_set_updated_at on public.collection_manifests;
create trigger collection_manifests_set_updated_at
before update on public.collection_manifests
for each row execute function public.set_updated_at();

alter table public.pickup_requests enable row level security;
alter table public.handover_qr_tokens enable row level security;
alter table public.collection_manifests enable row level security;
alter table public.collection_manifest_items enable row level security;
alter table public.hub_package_inspections enable row level security;

drop policy if exists "pickup_requests_select_participants" on public.pickup_requests;
create policy "pickup_requests_select_participants" on public.pickup_requests
for select using (
  requester_id = auth.uid()
  or assigned_transporter_id = auth.uid()
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

drop policy if exists "pickup_requests_write_owner_or_operations" on public.pickup_requests;
create policy "pickup_requests_write_owner_or_operations" on public.pickup_requests
for all using (
  requester_id = auth.uid()
  or assigned_transporter_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  requester_id = auth.uid()
  or assigned_transporter_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "handover_qr_tokens_select_participants" on public.handover_qr_tokens;
create policy "handover_qr_tokens_select_participants" on public.handover_qr_tokens
for select using (
  traveler_id = auth.uid()
  or created_by = auth.uid()
  or public.current_user_has_role(array['hub_agent', 'relay_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "handover_qr_tokens_write_staff" on public.handover_qr_tokens;
create policy "handover_qr_tokens_write_staff" on public.handover_qr_tokens
for all using (
  public.current_user_has_role(array['hub_agent', 'relay_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['hub_agent', 'relay_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "collection_manifests_select_staff" on public.collection_manifests;
create policy "collection_manifests_select_staff" on public.collection_manifests
for select using (
  public.current_user_has_role(array['collection_driver', 'hub_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "collection_manifests_write_staff" on public.collection_manifests;
create policy "collection_manifests_write_staff" on public.collection_manifests
for all using (
  public.current_user_has_role(array['collection_driver', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['collection_driver', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "collection_manifest_items_select_staff" on public.collection_manifest_items;
create policy "collection_manifest_items_select_staff" on public.collection_manifest_items
for select using (
  public.current_user_has_role(array['collection_driver', 'hub_agent', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "collection_manifest_items_write_staff" on public.collection_manifest_items;
create policy "collection_manifest_items_write_staff" on public.collection_manifest_items
for all using (
  public.current_user_has_role(array['collection_driver', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['collection_driver', 'operations_manager', 'admin', 'super_admin'])
);

drop policy if exists "hub_package_inspections_select_staff" on public.hub_package_inspections;
create policy "hub_package_inspections_select_staff" on public.hub_package_inspections
for select using (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'support_agent', 'admin', 'super_admin'])
);

drop policy if exists "hub_package_inspections_write_staff" on public.hub_package_inspections;
create policy "hub_package_inspections_write_staff" on public.hub_package_inspections
for all using (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('shipment-images', 'shipment-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('kyc-documents', 'kyc-documents', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('flight-tickets', 'flight-tickets', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('proof-of-delivery', 'proof-of-delivery', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('dispute-evidence', 'dispute-evidence', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('hub-inspection-images', 'hub-inspection-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_avatars_public_read" on storage.objects;
create policy "storage_avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "storage_private_owner_or_staff_read" on storage.objects;
create policy "storage_private_owner_or_staff_read" on storage.objects
for select using (
  bucket_id in (
    'shipment-images',
    'kyc-documents',
    'flight-tickets',
    'proof-of-delivery',
    'dispute-evidence',
    'hub-inspection-images'
  )
  and (
    auth.uid()::text = split_part(name, '/', 1)
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

drop policy if exists "storage_private_owner_upload" on storage.objects;
create policy "storage_private_owner_upload" on storage.objects
for insert with check (
  bucket_id in (
    'avatars',
    'shipment-images',
    'kyc-documents',
    'flight-tickets',
    'proof-of-delivery',
    'dispute-evidence',
    'hub-inspection-images'
  )
  and auth.uid()::text = split_part(name, '/', 1)
);

create or replace function public.hash_handover_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.dispatch_local_delivery_missions(
  p_shipment_id uuid,
  p_candidate_limit integer default 3
)
returns table (
  mission_id uuid,
  transporter_id uuid,
  score integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_match record;
  v_mission_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  for v_match in
    select *
    from public.find_local_transporter_matches(p_shipment_id)
    order by score desc
    limit greatest(p_candidate_limit, 1)
  loop
    insert into public.local_delivery_missions (
      shipment_id,
      transporter_id,
      status,
      score,
      reason,
      offered_at
    )
    values (
      p_shipment_id,
      v_match.transporter_id,
      'offered',
      v_match.score,
      v_match.reason,
      now()
    )
    on conflict (shipment_id, transporter_id) do update set
      status = case
        when public.local_delivery_missions.status = 'accepted' then 'accepted'::public.local_delivery_mission_status
        else 'offered'::public.local_delivery_mission_status
      end,
      score = excluded.score,
      reason = excluded.reason,
      offered_at = coalesce(public.local_delivery_missions.offered_at, excluded.offered_at),
      updated_at = now()
    returning id into v_mission_id;

    update public.pickup_requests
    set status = 'dispatched',
        mission_id = coalesce(public.pickup_requests.mission_id, v_mission_id),
        dispatched_at = coalesce(public.pickup_requests.dispatched_at, now())
    where shipment_id = p_shipment_id
      and status in ('requested', 'dispatched');

    mission_id := v_mission_id;
    transporter_id := v_match.transporter_id;
    score := v_match.score;
    return next;
  end loop;

  update public.shipments
  set status = 'matching'
  where id = p_shipment_id
    and status = 'confirmed';
end;
$$;

create or replace function public.create_operational_shipment(
  p_scope public.shipment_scope,
  p_service_level public.shipment_service_level,
  p_origin_city text,
  p_origin_country text,
  p_destination_city text,
  p_destination_country text,
  p_preferred_pickup_date date,
  p_latest_delivery_date date,
  p_estimated_price_cents integer,
  p_currency text,
  p_eta_min_days integer,
  p_eta_max_days integer,
  p_digital_twin jsonb,
  p_pickup_address jsonb,
  p_delivery_address jsonb,
  p_package jsonb,
  p_fulfillment_method public.shipment_fulfillment_method default 'pickup',
  p_package_photo_path text default null
)
returns table (
  id uuid,
  tracking_code text,
  scope public.shipment_scope,
  delivery_otp_code text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_tracking_code text;
  v_delivery_otp text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  v_delivery_otp := lpad(floor(random() * 1000000)::integer::text, 6, '0');

  insert into public.shipments (
    sender_id,
    scope,
    service_level,
    status,
    origin_city,
    origin_country,
    destination_city,
    destination_country,
    preferred_pickup_date,
    latest_delivery_date,
    estimated_price_cents,
    currency,
    eta_min_days,
    eta_max_days,
    digital_twin,
    fulfillment_method,
    package_photo_path,
    delivery_otp_code
  )
  values (
    auth.uid(),
    p_scope,
    p_service_level,
    'confirmed',
    p_origin_city,
    p_origin_country,
    p_destination_city,
    p_destination_country,
    p_preferred_pickup_date,
    p_latest_delivery_date,
    p_estimated_price_cents,
    p_currency,
    p_eta_min_days,
    p_eta_max_days,
    p_digital_twin,
    p_fulfillment_method,
    nullif(p_package_photo_path, ''),
    v_delivery_otp
  )
  returning shipments.id, shipments.tracking_code
  into v_shipment_id, v_tracking_code;

  insert into public.shipment_addresses (
    shipment_id,
    type,
    contact_name,
    contact_phone,
    contact_email,
    address_line1,
    address_line2,
    city,
    postal_code,
    country,
    instructions
  )
  values
    (
      v_shipment_id,
      'pickup',
      p_pickup_address->>'contact_name',
      p_pickup_address->>'contact_phone',
      nullif(p_pickup_address->>'contact_email', ''),
      p_pickup_address->>'address_line1',
      nullif(p_pickup_address->>'address_line2', ''),
      p_pickup_address->>'city',
      nullif(p_pickup_address->>'postal_code', ''),
      p_pickup_address->>'country',
      nullif(p_pickup_address->>'instructions', '')
    ),
    (
      v_shipment_id,
      'delivery',
      p_delivery_address->>'contact_name',
      p_delivery_address->>'contact_phone',
      nullif(p_delivery_address->>'contact_email', ''),
      p_delivery_address->>'address_line1',
      nullif(p_delivery_address->>'address_line2', ''),
      p_delivery_address->>'city',
      nullif(p_delivery_address->>'postal_code', ''),
      p_delivery_address->>'country',
      nullif(p_delivery_address->>'instructions', '')
    );

  insert into public.shipment_packages (
    shipment_id,
    category,
    title,
    description,
    weight_kg,
    length_cm,
    width_cm,
    height_cm,
    declared_value_cents,
    fragile,
    prohibited_items_confirmed
  )
  values (
    v_shipment_id,
    (p_package->>'category')::public.package_category,
    p_package->>'title',
    p_package->>'description',
    (p_package->>'weight_kg')::numeric,
    (p_package->>'length_cm')::numeric,
    (p_package->>'width_cm')::numeric,
    (p_package->>'height_cm')::numeric,
    (p_package->>'declared_value_cents')::integer,
    (p_package->>'fragile')::boolean,
    (p_package->>'prohibited_items_confirmed')::boolean
  );

  if p_fulfillment_method = 'pickup' then
    insert into public.pickup_requests (
      shipment_id,
      requester_id,
      requested_for,
      status,
      address_snapshot,
      note
    )
    values (
      v_shipment_id,
      auth.uid(),
      p_preferred_pickup_date,
      'requested',
      p_pickup_address,
      nullif(p_pickup_address->>'instructions', '')
    );
  end if;

  insert into public.shipment_status_events (
    shipment_id,
    actor_id,
    status,
    note,
    metadata
  )
  values (
    v_shipment_id,
    auth.uid(),
    'confirmed',
    'Expedition creee et confirmee par le client.',
    jsonb_build_object(
      'tracking_code',
      v_tracking_code,
      'fulfillment_method',
      p_fulfillment_method,
      'delivery_otp_enabled',
      true
    )
  );

  if p_scope = 'national' and p_fulfillment_method = 'pickup' then
    perform public.dispatch_local_delivery_missions(v_shipment_id, 3);
  end if;

  return query select v_shipment_id, v_tracking_code, p_scope, v_delivery_otp;
end;
$$;

create or replace function public.accept_local_delivery_mission(p_mission_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_mission public.local_delivery_missions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_mission
  from public.local_delivery_missions
  where id = p_mission_id
  for update;

  if v_mission.id is null then
    raise exception 'Mission not found';
  end if;

  if v_mission.transporter_id <> auth.uid() then
    raise exception 'Mission is not assigned to current transporter';
  end if;

  if v_mission.status not in ('suggested', 'offered') then
    raise exception 'Mission cannot be accepted from current status';
  end if;

  if exists (
    select 1
    from public.local_delivery_missions other
    where other.shipment_id = v_mission.shipment_id
      and other.id <> v_mission.id
      and other.status in ('accepted', 'picked_up', 'delivered')
    for update
  ) then
    raise exception 'Shipment already accepted by another transporter';
  end if;

  update public.local_delivery_missions
  set status = 'cancelled',
      updated_at = now()
  where shipment_id = v_mission.shipment_id
    and id <> v_mission.id
    and status in ('suggested', 'offered');

  update public.local_delivery_missions
  set status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  where id = v_mission.id;

  update public.pickup_requests
  set status = 'accepted',
      assigned_transporter_id = auth.uid(),
      mission_id = v_mission.id,
      accepted_at = now(),
      updated_at = now()
  where shipment_id = v_mission.shipment_id;

  update public.shipments
  set status = 'assigned'
  where id = v_mission.shipment_id
    and status in ('confirmed', 'matching', 'assigned');

  insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
  values (
    v_mission.shipment_id,
    auth.uid(),
    'assigned',
    'Mission acceptee par un livreur local.',
    jsonb_build_object('mission_id', v_mission.id)
  );

  return v_mission.id;
end;
$$;

create or replace function public.progress_local_delivery_mission(
  p_mission_id uuid,
  p_action text,
  p_delivery_otp text default null,
  p_proof_path text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_mission public.local_delivery_missions%rowtype;
  v_shipment public.shipments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_mission
  from public.local_delivery_missions
  where id = p_mission_id
  for update;

  if v_mission.id is null then
    raise exception 'Mission not found';
  end if;

  if v_mission.transporter_id <> auth.uid() then
    raise exception 'Mission is not assigned to current transporter';
  end if;

  select *
  into v_shipment
  from public.shipments
  where id = v_mission.shipment_id
  for update;

  if p_action = 'arrive' then
    update public.pickup_requests
    set status = 'arrived',
        arrived_at = now(),
        updated_at = now()
    where shipment_id = v_mission.shipment_id;

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    values (
      v_mission.shipment_id,
      auth.uid(),
      v_shipment.status,
      'Livreur arrive au point de retrait.',
      jsonb_build_object('mission_id', v_mission.id, 'action', p_action)
    );
  elsif p_action = 'pickup' then
    if v_mission.status <> 'accepted' then
      raise exception 'Mission must be accepted before pickup';
    end if;

    update public.local_delivery_missions
    set status = 'picked_up',
        picked_up_at = now(),
        updated_at = now()
    where id = v_mission.id;

    update public.pickup_requests
    set status = 'picked_up',
        picked_up_at = now(),
        updated_at = now()
    where shipment_id = v_mission.shipment_id;

    update public.shipments
    set status = 'picked_up'
    where id = v_mission.shipment_id;

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    values (
      v_mission.shipment_id,
      auth.uid(),
      'picked_up',
      'Colis retire par le livreur local.',
      jsonb_build_object('mission_id', v_mission.id)
    );
  elsif p_action = 'deliver' then
    if v_mission.status <> 'picked_up' then
      raise exception 'Mission must be picked up before delivery';
    end if;

    if v_shipment.delivery_otp_code is not null
      and v_shipment.delivery_otp_code <> nullif(p_delivery_otp, '') then
      raise exception 'Invalid delivery confirmation code';
    end if;

    update public.local_delivery_missions
    set status = 'delivered',
        delivered_at = now(),
        updated_at = now()
    where id = v_mission.id;

    update public.shipments
    set status = 'delivered',
        delivery_otp_confirmed_at = now(),
        proof_of_delivery_path = nullif(p_proof_path, ''),
        payout_eligible_for_release = true,
        payout_blocked_reason = null
    where id = v_mission.shipment_id;

    insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
    values (
      v_mission.shipment_id,
      auth.uid(),
      'delivered',
      'Livraison confirmee par code destinataire.',
      jsonb_build_object(
        'mission_id',
        v_mission.id,
        'proof_path',
        nullif(p_proof_path, '')
      )
    );

    insert into public.payouts (
      beneficiary_id,
      shipment_id,
      amount_cents,
      currency,
      status,
      scheduled_for,
      metadata
    )
    values (
      auth.uid(),
      v_mission.shipment_id,
      greatest(v_shipment.estimated_price_cents / 2, 100),
      v_shipment.currency,
      'pending',
      current_date + 1,
      jsonb_build_object('source', 'local_delivery_mission', 'mission_id', v_mission.id)
    );
  else
    raise exception 'Unsupported mission action';
  end if;

  return v_mission.id;
end;
$$;

create or replace function public.create_handover_qr_token(
  p_batch_id uuid,
  p_token_type public.handover_qr_token_type,
  p_expires_in_minutes integer default 30
)
returns table (
  token_id uuid,
  token text,
  expires_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_batch public.hub_batches%rowtype;
  v_token text;
  v_token_id uuid;
  v_expires_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_batch
  from public.hub_batches
  where id = p_batch_id
  for update;

  if v_batch.id is null then
    raise exception 'Batch not found';
  end if;

  v_token := encode(public.yobalelma_random_bytes(32), 'hex');
  v_expires_at := now() + make_interval(mins => least(greatest(p_expires_in_minutes, 5), 240));

  update public.handover_qr_tokens
  set status = 'revoked',
      revoked_at = now(),
      updated_at = now()
  where batch_id = p_batch_id
    and token_type = p_token_type
    and status = 'active';

  insert into public.handover_qr_tokens (
    token_hash,
    token_type,
    status,
    batch_id,
    trip_id,
    traveler_id,
    created_by,
    expires_at,
    metadata
  )
  values (
    public.hash_handover_token(v_token),
    p_token_type,
    'active',
    p_batch_id,
    v_batch.trip_id,
    v_batch.traveler_id,
    auth.uid(),
    v_expires_at,
    jsonb_build_object('batch_code', v_batch.code)
  )
  returning id into v_token_id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'qr_token_created',
    'hub_batch',
    p_batch_id,
    jsonb_build_object('token_type', p_token_type, 'expires_at', v_expires_at)
  );

  return query select v_token_id, v_token, v_expires_at;
end;
$$;

create or replace function public.scan_handover_qr_token(
  p_token text,
  p_expected_token_type public.handover_qr_token_type,
  p_note text default null,
  p_incident_type text default null
)
returns table (
  batch_id uuid,
  next_token text,
  next_token_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_token public.handover_qr_tokens%rowtype;
  v_next record;
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
      nullif(p_incident_type, '')
    )
  );

  if p_expected_token_type = 'origin_pickup' then
    update public.hub_batches
    set status = 'in_transit',
        sealed_by = coalesce(sealed_by, auth.uid()),
        sealed_at = coalesce(sealed_at, now())
    where id = v_token.batch_id;

    update public.capacity_reservations
    set status = 'loaded',
        updated_at = now()
    where batch_id = v_token.batch_id
      and status = 'reserved';

    update public.shipments
    set status = 'in_transit'
    where id in (
      select shipment_id
      from public.capacity_reservations
      where batch_id = v_token.batch_id
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
    if nullif(p_incident_type, '') is null then
      update public.hub_batches
      set status = 'closed'
      where id = v_token.batch_id;

      update public.capacity_reservations
      set status = 'released',
          updated_at = now()
      where batch_id = v_token.batch_id
        and status in ('reserved', 'loaded');

      update public.shipments
      set status = 'delivered',
          payout_eligible_for_release = true,
          payout_blocked_reason = null
      where id in (
        select shipment_id
        from public.capacity_reservations
        where batch_id = v_token.batch_id
      );

      insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
      select
        cr.shipment_id,
        auth.uid(),
        'delivered',
        coalesce(p_note, 'Lot receptionne a destination.'),
        jsonb_build_object('batch_id', v_token.batch_id, 'qr_token_id', v_token.id)
      from public.capacity_reservations cr
      where cr.batch_id = v_token.batch_id;
    else
      update public.hub_batches
      set status = 'arrived'
      where id = v_token.batch_id;

      update public.shipments
      set payout_eligible_for_release = false,
          payout_blocked_reason = p_incident_type
      where id in (
        select shipment_id
        from public.capacity_reservations
        where batch_id = v_token.batch_id
      );

      insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
      select
        cr.shipment_id,
        auth.uid(),
        s.status,
        coalesce(p_note, 'Incident constate a destination.'),
        jsonb_build_object(
          'batch_id',
          v_token.batch_id,
          'qr_token_id',
          v_token.id,
          'incident_type',
          p_incident_type
        )
      from public.capacity_reservations cr
      join public.shipments s on s.id = cr.shipment_id
      where cr.batch_id = v_token.batch_id;
    end if;

    batch_id := v_token.batch_id;
    next_token := null;
    next_token_expires_at := null;
    return next;
  end if;
end;
$$;
