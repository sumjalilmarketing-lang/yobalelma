create type public.shipment_scope as enum ('national', 'international');
create type public.shipment_status as enum (
  'confirmed',
  'matching',
  'assigned',
  'picked_up',
  'in_transit',
  'at_hub',
  'out_for_delivery',
  'delivered',
  'cancelled'
);
create type public.shipment_service_level as enum ('standard', 'express');
create type public.shipment_address_type as enum ('pickup', 'delivery');
create type public.package_category as enum (
  'documents',
  'clothing',
  'electronics',
  'food_dry',
  'cosmetics',
  'other'
);

create or replace function public.generate_tracking_code()
returns text
language sql
volatile
as $$
  select 'YBL-' || upper(substr(encode(public.yobalelma_random_bytes(6), 'hex'), 1, 8));
$$;

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null default public.generate_tracking_code(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  scope public.shipment_scope not null,
  service_level public.shipment_service_level not null default 'standard',
  status public.shipment_status not null default 'confirmed',
  origin_city text not null,
  origin_country text not null,
  destination_city text not null,
  destination_country text not null,
  preferred_pickup_date date not null,
  latest_delivery_date date not null,
  estimated_price_cents integer not null check (estimated_price_cents >= 0),
  currency text not null default 'EUR',
  eta_min_days integer not null check (eta_min_days > 0),
  eta_max_days integer not null check (eta_max_days >= eta_min_days),
  digital_twin jsonb not null,
  confirmation_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tracking_code),
  constraint shipments_dates_check check (latest_delivery_date >= preferred_pickup_date),
  constraint shipments_tracking_format_check check (tracking_code ~ '^YBL-[A-Z0-9]{8}$')
);

create table public.shipment_addresses (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  type public.shipment_address_type not null,
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  postal_code text,
  country text not null,
  instructions text,
  created_at timestamptz not null default now(),
  unique (shipment_id, type)
);

create table public.shipment_packages (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  category public.package_category not null,
  title text not null,
  description text not null,
  weight_kg numeric(8, 2) not null check (weight_kg > 0 and weight_kg <= 50),
  length_cm numeric(8, 2) not null check (length_cm > 0 and length_cm <= 200),
  width_cm numeric(8, 2) not null check (width_cm > 0 and width_cm <= 200),
  height_cm numeric(8, 2) not null check (height_cm > 0 and height_cm <= 200),
  declared_value_cents integer not null default 0 check (declared_value_cents >= 0),
  fragile boolean not null default false,
  prohibited_items_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (shipment_id)
);

create table public.shipment_status_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  status public.shipment_status not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index shipments_sender_idx on public.shipments (sender_id, created_at desc);
create index shipments_tracking_idx on public.shipments (tracking_code);
create index shipments_route_idx on public.shipments (
  origin_country,
  destination_country,
  scope,
  status
);
create index shipment_addresses_shipment_idx on public.shipment_addresses (shipment_id, type);
create index shipment_status_events_shipment_idx on public.shipment_status_events (
  shipment_id,
  created_at desc
);

create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();

alter table public.shipments enable row level security;
alter table public.shipment_addresses enable row level security;
alter table public.shipment_packages enable row level security;
alter table public.shipment_status_events enable row level security;

create policy "shipments_select_owner_or_staff" on public.shipments
for select using (
  sender_id = auth.uid()
  or public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "shipments_insert_owner" on public.shipments
for insert with check (sender_id = auth.uid());

create policy "shipments_update_owner_before_pickup" on public.shipments
for update using (
  sender_id = auth.uid()
  and status in ('confirmed', 'matching', 'assigned')
) with check (
  sender_id = auth.uid()
  and status in ('confirmed', 'matching', 'assigned', 'cancelled')
);

create policy "shipments_update_staff" on public.shipments
for update using (
  public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
) with check (
  public.current_user_has_role(array[
    'admin',
    'super_admin',
    'operations_manager',
    'support_agent'
  ])
);

create policy "shipment_addresses_select_owner_or_staff" on public.shipment_addresses
for select using (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_addresses.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin',
          'super_admin',
          'operations_manager',
          'support_agent'
        ])
      )
  )
);

create policy "shipment_addresses_insert_owner" on public.shipment_addresses
for insert with check (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_addresses.shipment_id
      and s.sender_id = auth.uid()
  )
);

create policy "shipment_addresses_update_owner_before_pickup" on public.shipment_addresses
for update using (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_addresses.shipment_id
      and s.sender_id = auth.uid()
      and s.status in ('confirmed', 'matching')
  )
) with check (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_addresses.shipment_id
      and s.sender_id = auth.uid()
      and s.status in ('confirmed', 'matching')
  )
);

create policy "shipment_packages_select_owner_or_staff" on public.shipment_packages
for select using (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_packages.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin',
          'super_admin',
          'operations_manager',
          'support_agent'
        ])
      )
  )
);

create policy "shipment_packages_insert_owner" on public.shipment_packages
for insert with check (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_packages.shipment_id
      and s.sender_id = auth.uid()
  )
);

create policy "shipment_packages_update_owner_before_pickup" on public.shipment_packages
for update using (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_packages.shipment_id
      and s.sender_id = auth.uid()
      and s.status in ('confirmed', 'matching')
  )
) with check (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_packages.shipment_id
      and s.sender_id = auth.uid()
      and s.status in ('confirmed', 'matching')
  )
);

create policy "shipment_status_events_select_owner_or_staff" on public.shipment_status_events
for select using (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_status_events.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin',
          'super_admin',
          'operations_manager',
          'support_agent'
        ])
      )
  )
);

create policy "shipment_status_events_insert_owner_or_staff" on public.shipment_status_events
for insert with check (
  exists (
    select 1
    from public.shipments s
    where s.id = shipment_status_events.shipment_id
      and (
        s.sender_id = auth.uid()
        or public.current_user_has_role(array[
          'admin',
          'super_admin',
          'operations_manager',
          'support_agent'
        ])
      )
  )
);

create or replace function public.create_shipment(
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
  p_package jsonb
)
returns table (id uuid, tracking_code text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_tracking_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

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
    digital_twin
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
    p_digital_twin
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
    jsonb_build_object('tracking_code', v_tracking_code)
  );

  return query select v_shipment_id, v_tracking_code;
end;
$$;
