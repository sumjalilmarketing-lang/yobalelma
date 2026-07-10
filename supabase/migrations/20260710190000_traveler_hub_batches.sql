create type public.travel_document_status as enum (
  'submitted',
  'approved',
  'rejected'
);
create type public.hub_batch_status as enum (
  'open',
  'sealed',
  'in_transit',
  'arrived',
  'closed',
  'cancelled'
);
create type public.capacity_reservation_status as enum (
  'reserved',
  'loaded',
  'released',
  'cancelled'
);

create table public.traveler_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  traveler_name text not null,
  document_number text not null,
  issuing_country text not null,
  departure_airport text not null,
  arrival_airport text not null,
  departure_date date not null,
  arrival_date date not null,
  file_path text not null,
  status public.travel_document_status not null default 'submitted',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint traveler_documents_dates_check check (arrival_date >= departure_date)
);

create table public.hub_batches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^HUB-[A-Z0-9]{6,12}$'),
  origin_hub text not null,
  destination_hub text not null,
  flight_number text,
  departure_date date not null,
  capacity_kg numeric(8, 2) not null check (capacity_kg > 0 and capacity_kg <= 1000),
  reserved_weight_kg numeric(8, 2) not null default 0 check (reserved_weight_kg >= 0),
  status public.hub_batch_status not null default 'open',
  qr_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  sealed_by uuid references public.profiles(id) on delete set null,
  sealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hub_batches_capacity_check check (reserved_weight_kg <= capacity_kg)
);

create table public.capacity_reservations (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.hub_batches(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  reserved_weight_kg numeric(8, 2) not null check (reserved_weight_kg > 0),
  status public.capacity_reservation_status not null default 'reserved',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, shipment_id)
);

create index traveler_documents_trip_idx on public.traveler_documents (trip_id, status);
create index traveler_documents_traveler_idx on public.traveler_documents (traveler_id, created_at desc);
create index hub_batches_status_idx on public.hub_batches (status, departure_date);
create index capacity_reservations_batch_idx on public.capacity_reservations (batch_id, status);
create index capacity_reservations_shipment_idx on public.capacity_reservations (shipment_id, status);

create trigger traveler_documents_set_updated_at
before update on public.traveler_documents
for each row execute function public.set_updated_at();

create trigger hub_batches_set_updated_at
before update on public.hub_batches
for each row execute function public.set_updated_at();

create trigger capacity_reservations_set_updated_at
before update on public.capacity_reservations
for each row execute function public.set_updated_at();

alter table public.traveler_documents enable row level security;
alter table public.hub_batches enable row level security;
alter table public.capacity_reservations enable row level security;

create policy "traveler_documents_select_owner_or_staff" on public.traveler_documents
for select using (
  traveler_id = auth.uid()
  or public.current_user_has_role(array[
    'hub_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "traveler_documents_insert_own" on public.traveler_documents
for insert with check (
  traveler_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = traveler_documents.trip_id
      and t.traveler_id = auth.uid()
  )
);

create policy "traveler_documents_update_staff" on public.traveler_documents
for update using (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
);

create policy "hub_batches_select_staff" on public.hub_batches
for select using (
  public.current_user_has_role(array[
    'hub_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "hub_batches_insert_staff" on public.hub_batches
for insert with check (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
);

create policy "hub_batches_update_staff" on public.hub_batches
for update using (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
);

create policy "capacity_reservations_select_participants" on public.capacity_reservations
for select using (
  exists (
    select 1
    from public.shipments s
    where s.id = capacity_reservations.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'hub_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "capacity_reservations_write_staff" on public.capacity_reservations
for all using (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
) with check (
  public.current_user_has_role(array['hub_agent', 'operations_manager', 'admin', 'super_admin'])
);

create or replace function public.reserve_batch_capacity(
  p_batch_id uuid,
  p_shipment_id uuid,
  p_reserved_weight_kg numeric
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_reservation_id uuid;
  v_capacity numeric;
  v_reserved numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select capacity_kg, reserved_weight_kg
  into v_capacity, v_reserved
  from public.hub_batches
  where id = p_batch_id
    and status = 'open'
  for update;

  if v_capacity is null then
    raise exception 'Open batch not found';
  end if;

  if v_reserved + p_reserved_weight_kg > v_capacity then
    raise exception 'Batch capacity exceeded';
  end if;

  insert into public.capacity_reservations (
    batch_id,
    shipment_id,
    reserved_weight_kg,
    status,
    created_by
  )
  values (
    p_batch_id,
    p_shipment_id,
    p_reserved_weight_kg,
    'reserved',
    auth.uid()
  )
  on conflict (batch_id, shipment_id) do update set
    reserved_weight_kg = excluded.reserved_weight_kg,
    status = 'reserved',
    updated_at = now()
  returning id into v_reservation_id;

  update public.hub_batches
  set reserved_weight_kg = (
    select coalesce(sum(reserved_weight_kg), 0)
    from public.capacity_reservations
    where batch_id = p_batch_id
      and status in ('reserved', 'loaded')
  ),
  qr_payload = jsonb_build_object(
    'batch_id',
    p_batch_id,
    'code',
    code,
    'reserved_weight_kg',
    (
      select coalesce(sum(reserved_weight_kg), 0)
      from public.capacity_reservations
      where batch_id = p_batch_id
        and status in ('reserved', 'loaded')
    )
  )
  where id = p_batch_id;

  update public.shipments
  set status = 'at_hub'
  where id = p_shipment_id
    and status in ('confirmed', 'matching', 'assigned', 'picked_up', 'at_hub');

  insert into public.shipment_status_events (
    shipment_id,
    actor_id,
    status,
    note,
    metadata
  )
  values (
    p_shipment_id,
    auth.uid(),
    'at_hub',
    'Capacite reservee dans un batch hub.',
    jsonb_build_object('batch_id', p_batch_id, 'reservation_id', v_reservation_id)
  );

  return v_reservation_id;
end;
$$;
