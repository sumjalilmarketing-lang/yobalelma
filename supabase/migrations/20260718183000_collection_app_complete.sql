-- Complete internal Collection App domain. Collection drivers only move freight
-- between Yobalelma relays, hubs and logistics infrastructure; never client homes.

create table if not exists public.collection_vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  model text not null,
  vehicle_type text not null check (vehicle_type in ('van','truck')),
  capacity_kg numeric(10,2) not null check (capacity_kg > 0),
  mileage_km numeric(12,1) not null default 0 check (mileage_km >= 0),
  fuel_percent smallint not null default 100 check (fuel_percent between 0 and 100),
  status text not null default 'ready' check (status in ('ready','maintenance','inspection','inactive')),
  assigned_driver_id uuid references public.profiles(id) on delete set null,
  next_maintenance_km numeric(12,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.collection_routes add column if not exists vehicle_id uuid references public.collection_vehicles(id) on delete set null;
alter table public.collection_routes add column if not exists route_kind text not null default 'relay_to_hub' check (route_kind in ('relay_to_hub','hub_to_hub','hub_to_airport','hub_to_port','hub_to_distribution_center'));
alter table public.collection_routes add column if not exists optimized_distance_km numeric(10,2);
alter table public.collection_routes add column if not exists estimated_duration_minutes integer;
alter table public.collection_routes add column if not exists optimization_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.collection_package_movements (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.collection_routes(id) on delete cascade,
  stop_id uuid references public.collection_route_stops(id) on delete set null,
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  movement_type text not null check (movement_type in ('loaded','unloaded','quantity_checked','photo_added','signature_added','anomaly_reported')),
  idempotency_key text not null unique,
  quantity integer not null default 1 check (quantity > 0),
  latitude double precision,
  longitude double precision,
  metadata jsonb not null default '{}'::jsonb,
  performed_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_gps_positions (
  id bigint generated always as identity primary key,
  route_id uuid not null references public.collection_routes(id) on delete cascade,
  driver_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_meters numeric(8,2) check (accuracy_meters >= 0),
  speed_kph numeric(8,2) check (speed_kph >= 0),
  heading_degrees numeric(6,2) check (heading_degrees between 0 and 360),
  recorded_at timestamptz not null default now()
);

create table if not exists public.collection_vehicle_checks (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.collection_vehicles(id) on delete cascade,
  driver_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  check_type text not null check (check_type in ('pre_trip','post_trip','incident')),
  mileage_km numeric(12,1) not null check (mileage_km >= 0),
  fuel_percent smallint check (fuel_percent between 0 and 100),
  checklist jsonb not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_maintenance_events (
  id uuid primary key default gen_random_uuid(), vehicle_id uuid not null references public.collection_vehicles(id) on delete cascade,
  event_type text not null, status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  scheduled_at timestamptz, completed_at timestamptz, mileage_km numeric(12,1), cost_cents bigint check (cost_cents >= 0), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.collection_fuel_logs (
  id uuid primary key default gen_random_uuid(), vehicle_id uuid not null references public.collection_vehicles(id) on delete cascade,
  driver_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  liters numeric(10,2) not null check (liters > 0), mileage_km numeric(12,1) not null check (mileage_km >= 0), amount_cents bigint check (amount_cents >= 0),
  receipt_path text, station_name text, latitude double precision, longitude double precision, created_at timestamptz not null default now()
);

create table if not exists public.collection_offline_operations (
  id uuid primary key default gen_random_uuid(), driver_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  device_operation_id text not null, operation_type text not null, payload jsonb not null, status text not null default 'pending' check (status in ('pending','applied','conflict','rejected')),
  conflict_reason text, created_at timestamptz not null default now(), applied_at timestamptz, unique(driver_id, device_operation_id)
);

create table if not exists public.collection_messages (
  id uuid primary key default gen_random_uuid(), route_id uuid references public.collection_routes(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade, body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(), read_at timestamptz
);

create index if not exists collection_movements_route_idx on public.collection_package_movements(route_id, created_at desc);
create index if not exists collection_gps_route_time_idx on public.collection_gps_positions(route_id, recorded_at desc);
create index if not exists collection_offline_driver_status_idx on public.collection_offline_operations(driver_id, status, created_at);
create index if not exists collection_messages_route_time_idx on public.collection_messages(route_id, created_at desc);

alter table public.collection_vehicles enable row level security;
alter table public.collection_package_movements enable row level security;
alter table public.collection_gps_positions enable row level security;
alter table public.collection_vehicle_checks enable row level security;
alter table public.collection_maintenance_events enable row level security;
alter table public.collection_fuel_logs enable row level security;
alter table public.collection_offline_operations enable row level security;
alter table public.collection_messages enable row level security;

drop policy if exists "collection_routes_select_driver_or_staff" on public.collection_routes;
create policy "collection_routes_select_assigned_or_manager" on public.collection_routes for select using (
  driver_id = auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
);
drop policy if exists "collection_route_stops_select_driver_or_staff" on public.collection_route_stops;
create policy "collection_stops_select_assigned_or_manager" on public.collection_route_stops for select using (
  exists(select 1 from public.collection_routes r where r.id = route_id and r.driver_id = auth.uid())
  or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
);

create policy "collection_vehicles_visible_to_collection" on public.collection_vehicles for select using (
  assigned_driver_id = auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
);
create policy "collection_vehicles_manager_write" on public.collection_vehicles for all using (public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])) with check (public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_movements_route_participant" on public.collection_package_movements for select using (
  exists(select 1 from public.collection_routes r where r.id = route_id and r.driver_id = auth.uid()) or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])
);
create policy "collection_gps_route_participant" on public.collection_gps_positions for select using (driver_id = auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_checks_own_or_manager" on public.collection_vehicle_checks for select using (driver_id = auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_checks_insert_own" on public.collection_vehicle_checks for insert with check (driver_id = auth.uid() and public.current_user_has_role(array['collection_driver','collection_manager','operations_manager']));
create policy "collection_maintenance_visible" on public.collection_maintenance_events for select using (exists(select 1 from public.collection_vehicles v where v.id = vehicle_id and v.assigned_driver_id = auth.uid()) or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_maintenance_manager_write" on public.collection_maintenance_events for all using (public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin'])) with check (public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_fuel_own_or_manager" on public.collection_fuel_logs for select using (driver_id = auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_fuel_insert_own" on public.collection_fuel_logs for insert with check (driver_id = auth.uid() and public.current_user_has_role(array['collection_driver','collection_manager','operations_manager']));
create policy "collection_offline_own" on public.collection_offline_operations for select using (driver_id = auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_messages_participants" on public.collection_messages for select using (sender_id = auth.uid() or recipient_id = auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']));
create policy "collection_messages_send" on public.collection_messages for insert with check (sender_id = auth.uid() and public.current_user_has_role(array['collection_driver','collection_manager','operations_manager']));

create or replace function public.record_collection_movement(p_route_id uuid, p_shipment_id uuid, p_movement_type text, p_idempotency_key text, p_stop_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_driver uuid;
begin
  if auth.uid() is null or not public.current_user_has_role(array['collection_driver','collection_manager','operations_manager','admin','super_admin']) then raise exception 'Collection permission required'; end if;
  if p_movement_type not in ('loaded','unloaded','quantity_checked','photo_added','signature_added','anomaly_reported') then raise exception 'Unsupported movement type'; end if;
  select driver_id into v_driver from public.collection_routes where id = p_route_id for update;
  if v_driver is null then raise exception 'Collection route not found or unassigned'; end if;
  if v_driver <> auth.uid() and not public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']) then raise exception 'Route is assigned to another driver'; end if;
  insert into public.collection_package_movements(route_id,stop_id,shipment_id,movement_type,idempotency_key,metadata,performed_by)
  values(p_route_id,p_stop_id,p_shipment_id,p_movement_type,p_idempotency_key,coalesce(p_metadata,'{}'::jsonb),auth.uid())
  on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into v_id;
  insert into public.audit_log_events(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'collection_'||p_movement_type,'shipment',p_shipment_id,jsonb_build_object('route_id',p_route_id,'movement_id',v_id));
  return v_id;
end $$;

create or replace function public.record_collection_gps(p_route_id uuid, p_latitude double precision, p_longitude double precision, p_accuracy_meters numeric default null, p_speed_kph numeric default null, p_heading_degrees numeric default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.collection_routes where id=p_route_id and (driver_id=auth.uid() or public.current_user_has_role(array['collection_manager','operations_manager','admin','super_admin']))) then raise exception 'Route access denied'; end if;
  insert into public.collection_gps_positions(route_id,driver_id,latitude,longitude,accuracy_meters,speed_kph,heading_degrees) values(p_route_id,auth.uid(),p_latitude,p_longitude,p_accuracy_meters,p_speed_kph,p_heading_degrees) returning id into v_id;
  return v_id;
end $$;

revoke all on function public.record_collection_movement(uuid,uuid,text,text,uuid,jsonb) from public;
revoke all on function public.record_collection_gps(uuid,double precision,double precision,numeric,numeric,numeric) from public;
grant execute on function public.record_collection_movement(uuid,uuid,text,text,uuid,jsonb) to authenticated;
grant execute on function public.record_collection_gps(uuid,double precision,double precision,numeric,numeric,numeric) to authenticated;
