create type public.transporter_status as enum ('pending', 'active', 'suspended');
create type public.vehicle_type as enum ('bike', 'scooter', 'car', 'van', 'truck');
create type public.transporter_availability_status as enum ('available', 'booked', 'offline');
create type public.local_delivery_mission_status as enum (
  'suggested',
  'offered',
  'accepted',
  'picked_up',
  'delivered',
  'cancelled'
);

create table public.transporter_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  bio text not null,
  base_city text not null,
  base_country text not null,
  max_weight_kg numeric(8, 2) not null check (max_weight_kg > 0 and max_weight_kg <= 200),
  status public.transporter_status not null default 'pending',
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  completed_missions integer not null default 0 check (completed_missions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transporter_vehicles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.transporter_profiles(profile_id) on delete cascade,
  type public.vehicle_type not null,
  label text not null,
  plate_number text,
  capacity_kg numeric(8, 2) not null check (capacity_kg > 0 and capacity_kg <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transporter_zones (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.transporter_profiles(profile_id) on delete cascade,
  city text not null,
  country text not null,
  radius_km integer not null check (radius_km > 0 and radius_km <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transporter_availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.transporter_profiles(profile_id) on delete cascade,
  available_on date not null,
  starts_at time not null,
  ends_at time not null,
  status public.transporter_availability_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transporter_availability_time_check check (ends_at > starts_at)
);

create table public.local_delivery_missions (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  transporter_id uuid not null references public.transporter_profiles(profile_id) on delete cascade,
  status public.local_delivery_mission_status not null default 'suggested',
  score integer not null default 0 check (score >= 0),
  reason text[] not null default array[]::text[],
  offered_at timestamptz,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_id, transporter_id)
);

create index transporter_profiles_status_idx
  on public.transporter_profiles (status, base_country, base_city);

create index transporter_vehicles_profile_idx
  on public.transporter_vehicles (profile_id, active, capacity_kg);

create index transporter_zones_lookup_idx
  on public.transporter_zones (country, city, active);

create index transporter_availability_lookup_idx
  on public.transporter_availability (available_on, status, profile_id);

create index local_delivery_missions_transporter_idx
  on public.local_delivery_missions (transporter_id, status, created_at desc);

create trigger transporter_profiles_set_updated_at
before update on public.transporter_profiles
for each row execute function public.set_updated_at();

create trigger transporter_vehicles_set_updated_at
before update on public.transporter_vehicles
for each row execute function public.set_updated_at();

create trigger transporter_zones_set_updated_at
before update on public.transporter_zones
for each row execute function public.set_updated_at();

create trigger transporter_availability_set_updated_at
before update on public.transporter_availability
for each row execute function public.set_updated_at();

create trigger local_delivery_missions_set_updated_at
before update on public.local_delivery_missions
for each row execute function public.set_updated_at();

alter table public.transporter_profiles enable row level security;
alter table public.transporter_vehicles enable row level security;
alter table public.transporter_zones enable row level security;
alter table public.transporter_availability enable row level security;
alter table public.local_delivery_missions enable row level security;

create policy "transporter_profiles_select_visible" on public.transporter_profiles
for select using (
  profile_id = auth.uid()
  or status = 'active'
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "transporter_profiles_upsert_own" on public.transporter_profiles
for insert with check (profile_id = auth.uid());

create policy "transporter_profiles_update_own" on public.transporter_profiles
for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "transporter_profiles_update_staff" on public.transporter_profiles
for update using (
  public.current_user_has_role(array['admin', 'super_admin', 'operations_manager'])
) with check (
  public.current_user_has_role(array['admin', 'super_admin', 'operations_manager'])
);

create policy "transporter_children_select_visible" on public.transporter_vehicles
for select using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.transporter_profiles tp
    where tp.profile_id = transporter_vehicles.profile_id
      and tp.status = 'active'
  )
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "transporter_vehicles_insert_own" on public.transporter_vehicles
for insert with check (profile_id = auth.uid());

create policy "transporter_vehicles_update_own" on public.transporter_vehicles
for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "transporter_zones_select_visible" on public.transporter_zones
for select using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.transporter_profiles tp
    where tp.profile_id = transporter_zones.profile_id
      and tp.status = 'active'
  )
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "transporter_zones_insert_own" on public.transporter_zones
for insert with check (profile_id = auth.uid());

create policy "transporter_zones_update_own" on public.transporter_zones
for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "transporter_availability_select_own_or_staff" on public.transporter_availability
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "transporter_availability_insert_own" on public.transporter_availability
for insert with check (profile_id = auth.uid());

create policy "transporter_availability_update_own" on public.transporter_availability
for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "local_delivery_missions_select_participants" on public.local_delivery_missions
for select using (
  transporter_id = auth.uid()
  or exists (
    select 1
    from public.shipments s
    where s.id = local_delivery_missions.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "local_delivery_missions_insert_staff_or_sender" on public.local_delivery_missions
for insert with check (
  exists (
    select 1
    from public.shipments s
    where s.id = local_delivery_missions.shipment_id
      and s.sender_id = auth.uid()
  )
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager'
  ])
);

create policy "local_delivery_missions_update_transporter_or_staff" on public.local_delivery_missions
for update using (
  transporter_id = auth.uid()
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager'
  ])
) with check (
  transporter_id = auth.uid()
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager'
  ])
);

create or replace function public.find_local_transporter_matches(p_shipment_id uuid)
returns table (
  transporter_id uuid,
  business_name text,
  score integer,
  reason text[]
)
language sql
stable
security invoker
set search_path = public
as $$
  with target_shipment as (
    select
      s.id,
      s.scope,
      s.origin_city,
      s.origin_country,
      s.destination_city,
      s.destination_country,
      s.preferred_pickup_date,
      p.weight_kg
    from public.shipments s
    join public.shipment_packages p on p.shipment_id = s.id
    where s.id = p_shipment_id
      and s.scope = 'national'
      and s.status in ('confirmed', 'matching')
  ),
  scored as (
    select
      tp.profile_id as transporter_id,
      tp.business_name,
      (
        case when pickup_zone.id is not null then 40 else 0 end
        + case when delivery_zone.id is not null then 40 else 0 end
        + case when v.id is not null then 15 else 0 end
        + case when a.id is not null then 5 else 0 end
      ) as score,
      array_remove(array[
        case when pickup_zone.id is not null then 'Zone depart couverte' end,
        case when delivery_zone.id is not null then 'Zone destination couverte' end,
        case when v.id is not null then 'Vehicule compatible' end,
        case when a.id is not null then 'Disponibilite declaree' end
      ], null) as reason
    from target_shipment ts
    join public.transporter_profiles tp
      on tp.status = 'active'
      and lower(tp.base_country) = lower(ts.origin_country)
    left join public.transporter_zones pickup_zone
      on pickup_zone.profile_id = tp.profile_id
      and pickup_zone.active = true
      and lower(pickup_zone.country) = lower(ts.origin_country)
      and lower(pickup_zone.city) = lower(ts.origin_city)
    left join public.transporter_zones delivery_zone
      on delivery_zone.profile_id = tp.profile_id
      and delivery_zone.active = true
      and lower(delivery_zone.country) = lower(ts.destination_country)
      and lower(delivery_zone.city) = lower(ts.destination_city)
    left join public.transporter_vehicles v
      on v.profile_id = tp.profile_id
      and v.active = true
      and v.capacity_kg >= ts.weight_kg
    left join public.transporter_availability a
      on a.profile_id = tp.profile_id
      and a.status = 'available'
      and a.available_on = ts.preferred_pickup_date
  )
  select transporter_id, business_name, score, reason
  from scored
  where score >= 60
  order by score desc, business_name asc
  limit 10;
$$;

create or replace function public.create_local_delivery_mission(
  p_shipment_id uuid,
  p_transporter_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_mission_id uuid;
  v_match_id uuid;
  v_match_score integer;
  v_match_reason text[];
begin
  select transporter_id, score, reason
  into v_match_id, v_match_score, v_match_reason
  from public.find_local_transporter_matches(p_shipment_id)
  where transporter_id = p_transporter_id
  limit 1;

  if v_match_id is null then
    raise exception 'Transporter is not compatible with this shipment';
  end if;

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
    p_transporter_id,
    'offered',
    v_match_score,
    v_match_reason,
    now()
  )
  on conflict (shipment_id, transporter_id) do update set
    score = excluded.score,
    reason = excluded.reason,
    offered_at = coalesce(public.local_delivery_missions.offered_at, excluded.offered_at),
    updated_at = now()
  returning id into v_mission_id;

  update public.shipments
  set status = 'matching'
  where id = p_shipment_id
    and status = 'confirmed';

  return v_mission_id;
end;
$$;
