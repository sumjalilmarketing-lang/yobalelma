create type public.relay_point_status as enum ('active', 'inactive', 'suspended');
create type public.relay_scan_type as enum ('check_in', 'check_out', 'handover', 'exception');
create type public.relay_inventory_status as enum ('stored', 'released', 'exception');
create type public.collection_route_status as enum (
  'planned',
  'in_progress',
  'completed',
  'cancelled'
);
create type public.collection_stop_status as enum (
  'pending',
  'arrived',
  'completed',
  'skipped'
);

create table public.relay_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null,
  contact_phone text not null,
  address_line1 text not null,
  city text not null,
  country text not null,
  postal_code text,
  capacity_slots integer not null check (capacity_slots > 0),
  status public.relay_point_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relay_inventory (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  current_relay_point_id uuid not null references public.relay_points(id) on delete restrict,
  status public.relay_inventory_status not null default 'stored',
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_id)
);

create table public.relay_scan_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  relay_point_id uuid not null references public.relay_points(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  scan_type public.relay_scan_type not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.collection_routes (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles(id) on delete set null,
  name text not null,
  route_date date not null,
  status public.collection_route_status not null default 'planned',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.collection_routes(id) on delete cascade,
  relay_point_id uuid not null references public.relay_points(id) on delete restrict,
  stop_order integer not null check (stop_order > 0),
  status public.collection_stop_status not null default 'pending',
  arrived_at timestamptz,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (route_id, stop_order)
);

create index relay_points_lookup_idx on public.relay_points (country, city, status);
create index relay_inventory_shipment_idx on public.relay_inventory (shipment_id, status);
create index relay_inventory_point_idx on public.relay_inventory (current_relay_point_id, status);
create index relay_scan_events_shipment_idx on public.relay_scan_events (shipment_id, created_at desc);
create index collection_routes_driver_idx on public.collection_routes (driver_id, route_date, status);
create index collection_route_stops_route_idx on public.collection_route_stops (route_id, stop_order);

create trigger relay_points_set_updated_at
before update on public.relay_points
for each row execute function public.set_updated_at();

create trigger relay_inventory_set_updated_at
before update on public.relay_inventory
for each row execute function public.set_updated_at();

create trigger collection_routes_set_updated_at
before update on public.collection_routes
for each row execute function public.set_updated_at();

create trigger collection_route_stops_set_updated_at
before update on public.collection_route_stops
for each row execute function public.set_updated_at();

alter table public.relay_points enable row level security;
alter table public.relay_inventory enable row level security;
alter table public.relay_scan_events enable row level security;
alter table public.collection_routes enable row level security;
alter table public.collection_route_stops enable row level security;

create policy "shipments_update_relay_operations" on public.shipments
for update using (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "shipment_status_events_insert_relay_operations" on public.shipment_status_events
for insert with check (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "relay_points_select_active_or_staff" on public.relay_points
for select using (
  status = 'active'
  or public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "relay_points_insert_staff" on public.relay_points
for insert with check (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "relay_points_update_staff" on public.relay_points
for update using (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "relay_inventory_select_participants" on public.relay_inventory
for select using (
  exists (
    select 1
    from public.shipments s
    where s.id = relay_inventory.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "relay_inventory_write_staff" on public.relay_inventory
for all using (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "relay_scan_events_select_participants" on public.relay_scan_events
for select using (
  exists (
    select 1
    from public.shipments s
    where s.id = relay_scan_events.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "relay_scan_events_insert_staff" on public.relay_scan_events
for insert with check (
  public.current_user_has_role(array[
    'relay_agent',
    'hub_agent',
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "collection_routes_select_driver_or_staff" on public.collection_routes
for select using (
  driver_id = auth.uid()
  or public.current_user_has_role(array[
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "collection_routes_write_staff" on public.collection_routes
for all using (
  public.current_user_has_role(array[
    'operations_manager',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "collection_route_stops_select_driver_or_staff" on public.collection_route_stops
for select using (
  exists (
    select 1
    from public.collection_routes r
    where r.id = collection_route_stops.route_id
      and r.driver_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'collection_driver',
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create policy "collection_route_stops_write_staff" on public.collection_route_stops
for all using (
  public.current_user_has_role(array[
    'operations_manager',
    'admin',
    'super_admin'
  ])
) with check (
  public.current_user_has_role(array[
    'operations_manager',
    'admin',
    'super_admin'
  ])
);

create or replace function public.record_relay_scan(
  p_tracking_code text,
  p_relay_point_id uuid,
  p_scan_type public.relay_scan_type,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_scan_id uuid;
  v_next_status public.shipment_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select id
  into v_shipment_id
  from public.shipments
  where tracking_code = p_tracking_code
  limit 1;

  if v_shipment_id is null then
    raise exception 'Shipment not found';
  end if;

  insert into public.relay_scan_events (
    shipment_id,
    relay_point_id,
    actor_id,
    scan_type,
    note
  )
  values (
    v_shipment_id,
    p_relay_point_id,
    auth.uid(),
    p_scan_type,
    p_note
  )
  returning id into v_scan_id;

  if p_scan_type = 'check_in' then
    insert into public.relay_inventory (
      shipment_id,
      current_relay_point_id,
      status,
      checked_in_at,
      checked_out_at,
      updated_by
    )
    values (
      v_shipment_id,
      p_relay_point_id,
      'stored',
      now(),
      null,
      auth.uid()
    )
    on conflict (shipment_id) do update set
      current_relay_point_id = excluded.current_relay_point_id,
      status = 'stored',
      checked_in_at = excluded.checked_in_at,
      checked_out_at = null,
      updated_by = excluded.updated_by,
      updated_at = now();

    v_next_status := 'at_hub';
  elsif p_scan_type in ('check_out', 'handover') then
    update public.relay_inventory
    set status = 'released',
        checked_out_at = now(),
        updated_by = auth.uid(),
        updated_at = now()
    where shipment_id = v_shipment_id;

    v_next_status := case
      when p_scan_type = 'handover' then 'delivered'::public.shipment_status
      else 'out_for_delivery'::public.shipment_status
    end;
  else
    update public.relay_inventory
    set status = 'exception',
        updated_by = auth.uid(),
        updated_at = now()
    where shipment_id = v_shipment_id;

    v_next_status := 'at_hub';
  end if;

  update public.shipments
  set status = v_next_status
  where id = v_shipment_id;

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
    v_next_status,
    coalesce(p_note, 'Scan relais ' || p_scan_type::text),
    jsonb_build_object(
      'relay_point_id',
      p_relay_point_id,
      'scan_id',
      v_scan_id,
      'scan_type',
      p_scan_type
    )
  );

  return v_scan_id;
end;
$$;
