create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'hub_inventory_status') then
    create type public.hub_inventory_status as enum (
      'expected',
      'received',
      'inspection_required',
      'in_storage',
      'reserved_for_batch',
      'picked_for_batch',
      'handed_over',
      'missing',
      'damaged',
      'quarantined',
      'released'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hub_inbound_receipt_status') then
    create type public.hub_inbound_receipt_status as enum (
      'draft',
      'scanning',
      'needs_review',
      'confirmed',
      'partially_confirmed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hub_inbound_item_status') then
    create type public.hub_inbound_item_status as enum (
      'expected_at_hub',
      'received_at_hub',
      'partially_received',
      'missing_at_hub',
      'damaged_at_hub',
      'extra_at_hub',
      'quarantined',
      'rejected_at_hub'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hub_advanced_inspection_decision') then
    create type public.hub_advanced_inspection_decision as enum (
      'approved',
      'needs_repackaging',
      'needs_customer_confirmation',
      'blocked',
      'rejected',
      'quarantined'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'operational_incident_type') then
    create type public.operational_incident_type as enum (
      'missing_package',
      'extra_package',
      'damaged_package',
      'wrong_weight',
      'wrong_dimensions',
      'prohibited_item',
      'packaging_issue',
      'wrong_destination',
      'traveler_cancelled',
      'flight_changed',
      'capacity_mismatch',
      'qr_issue',
      'storage_issue',
      'manifest_mismatch',
      'manual_review'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'operational_incident_status') then
    create type public.operational_incident_status as enum (
      'open',
      'assigned',
      'escalated',
      'blocked',
      'resolved',
      'closed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'operational_priority') then
    create type public.operational_priority as enum (
      'low',
      'medium',
      'high',
      'urgent'
    );
  end if;
end $$;

alter type public.hub_batch_status add value if not exists 'draft';
alter type public.hub_batch_status add value if not exists 'capacity_reserved';
alter type public.hub_batch_status add value if not exists 'preparing';
alter type public.hub_batch_status add value if not exists 'awaiting_validation';
alter type public.hub_batch_status add value if not exists 'ready';
alter type public.hub_batch_status add value if not exists 'pickup_qr_generated';
alter type public.hub_batch_status add value if not exists 'handed_over';
alter type public.hub_batch_status add value if not exists 'destination_received';
alter type public.hub_batch_status add value if not exists 'partially_received';
alter type public.hub_batch_status add value if not exists 'disputed';
alter type public.hub_batch_status add value if not exists 'completed';

create table if not exists public.airport_hubs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,24}$'),
  name text not null,
  country text not null,
  city text not null,
  airport_code text not null check (airport_code ~ '^[A-Z0-9]{3,8}$'),
  timezone text not null default 'UTC',
  address text,
  opening_hours jsonb not null default '{}'::jsonb,
  max_daily_packages integer not null default 0 check (max_daily_packages >= 0),
  max_storage_weight_kg numeric(10, 2) not null default 0 check (max_storage_weight_kg >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_agent_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete restrict,
  role_title text not null default 'Hub agent',
  can_validate_batches boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  managed_hub_ids uuid[] not null default '{}',
  managed_country_codes text[] not null default '{}',
  can_override_status boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id text primary key,
  name text not null,
  description text,
  is_internal boolean not null default false,
  is_critical boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id text primary key,
  resource text not null,
  action text not null,
  description text,
  is_critical boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resource, action)
);

create table if not exists public.role_permissions (
  role_id text not null references public.roles(id) on delete cascade,
  permission_id text not null references public.permissions(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id text not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (profile_id, role_id)
);

create table if not exists public.hub_zones (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  code text not null,
  name text not null,
  zone_type text not null default 'storage',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hub_id, code)
);

create table if not exists public.hub_aisles (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  zone_id uuid not null references public.hub_zones(id) on delete cascade,
  code text not null,
  name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, code)
);

create table if not exists public.hub_shelves (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  aisle_id uuid not null references public.hub_aisles(id) on delete cascade,
  code text not null,
  max_weight_kg numeric(10, 2) not null default 0 check (max_weight_kg >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aisle_id, code)
);

create table if not exists public.hub_storage_locations (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete cascade,
  zone_id uuid not null references public.hub_zones(id) on delete cascade,
  aisle_id uuid references public.hub_aisles(id) on delete set null,
  shelf_id uuid references public.hub_shelves(id) on delete set null,
  code text not null,
  barcode text,
  location_type text not null default 'shelf',
  max_weight_kg numeric(10, 2) not null default 0 check (max_weight_kg >= 0),
  is_pickable boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hub_id, code)
);

create table if not exists public.hub_inventory (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete restrict,
  location_id uuid references public.hub_storage_locations(id) on delete set null,
  status public.hub_inventory_status not null default 'received',
  destination_country text,
  destination_city text,
  priority public.operational_priority not null default 'medium',
  measured_weight_kg numeric(8, 2) check (measured_weight_kg is null or measured_weight_kg > 0),
  current_batch_id uuid references public.hub_batches(id) on delete set null,
  incident_id uuid,
  entered_at timestamptz not null default now(),
  last_movement_at timestamptz not null default now(),
  released_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.hub_inventory(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete restrict,
  from_location_id uuid references public.hub_storage_locations(id) on delete set null,
  to_location_id uuid references public.hub_storage_locations(id) on delete set null,
  movement_type text not null default 'move',
  scanned_by uuid references public.profiles(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_inbound_receipts (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.airport_hubs(id) on delete restrict,
  manifest_id uuid references public.collection_manifests(id) on delete set null,
  receipt_code text not null unique default ('HIR-' || upper(substr(encode(public.yobalelma_random_bytes(8), 'hex'), 1, 12))),
  status public.hub_inbound_receipt_status not null default 'draft',
  expected_count integer not null default 0 check (expected_count >= 0),
  received_count integer not null default 0 check (received_count >= 0),
  missing_count integer not null default 0 check (missing_count >= 0),
  damaged_count integer not null default 0 check (damaged_count >= 0),
  extra_count integer not null default 0 check (extra_count >= 0),
  received_by uuid references public.profiles(id) on delete set null,
  received_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_inbound_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.hub_inbound_receipts(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  tracking_code text,
  status public.hub_inbound_item_status not null,
  condition_note text,
  photo_paths text[] not null default '{}',
  scanned_by uuid references public.profiles(id) on delete set null,
  scanned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (receipt_id, shipment_id)
);

create table if not exists public.hub_inspections (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  hub_id uuid not null references public.airport_hubs(id) on delete restrict,
  inventory_id uuid references public.hub_inventory(id) on delete set null,
  declared_weight_kg numeric(8, 2),
  measured_weight_kg numeric(8, 2) not null check (measured_weight_kg > 0),
  declared_dimensions jsonb not null default '{}'::jsonb,
  measured_dimensions jsonb not null default '{}'::jsonb,
  package_condition text not null default 'good',
  packaging_compliant boolean not null default true,
  declared_content text,
  category text,
  fragile boolean not null default false,
  declared_value_cents integer not null default 0 check (declared_value_cents >= 0),
  weight_variance_percent numeric(8, 2) not null default 0,
  alert_threshold_percent numeric(8, 2) not null default 5,
  block_threshold_percent numeric(8, 2) not null default 15,
  decision public.hub_advanced_inspection_decision not null,
  anomaly_type public.operational_incident_type,
  photo_paths text[] not null default '{}',
  note text,
  inspected_by uuid references public.profiles(id) on delete set null,
  inspected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_code text not null unique default ('INC-' || upper(substr(encode(public.yobalelma_random_bytes(8), 'hex'), 1, 12))),
  incident_type public.operational_incident_type not null,
  status public.operational_incident_status not null default 'open',
  priority public.operational_priority not null default 'medium',
  hub_id uuid references public.airport_hubs(id) on delete set null,
  shipment_id uuid references public.shipments(id) on delete set null,
  batch_id uuid references public.hub_batches(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  escalated_to_role text,
  title text not null,
  description text,
  photo_paths text[] not null default '{}',
  document_paths text[] not null default '{}',
  blocks_shipment boolean not null default false,
  blocks_batch boolean not null default false,
  blocks_payout boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hub_inventory_incident_id_fkey'
      and conrelid = 'public.hub_inventory'::regclass
  ) then
    alter table public.hub_inventory
      add constraint hub_inventory_incident_id_fkey
      foreign key (incident_id) references public.operational_incidents(id) on delete set null;
  end if;
end;
$$;

alter table public.hub_batches
  add column if not exists hub_id uuid references public.airport_hubs(id) on delete set null,
  add column if not exists destination_country text,
  add column if not exists destination_city text,
  add column if not exists preparation_location_id uuid references public.hub_storage_locations(id) on delete set null,
  add column if not exists prepared_by uuid references public.profiles(id) on delete set null,
  add column if not exists validated_by uuid references public.profiles(id) on delete set null,
  add column if not exists validated_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists handover_deadline_at timestamptz,
  add column if not exists anomaly_count integer not null default 0 check (anomaly_count >= 0);

create table if not exists public.hub_batch_shipments (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.hub_batches(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  inventory_id uuid references public.hub_inventory(id) on delete set null,
  reserved_weight_kg numeric(8, 2) not null check (reserved_weight_kg > 0),
  status text not null default 'reserved',
  added_by uuid references public.profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (batch_id, shipment_id)
);

create table if not exists public.batch_documents (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.hub_batches(id) on delete cascade,
  document_type text not null,
  file_path text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.batch_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.hub_batches(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_handover_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.hub_batches(id) on delete cascade,
  token_id uuid references public.handover_qr_tokens(id) on delete set null,
  hub_id uuid references public.airport_hubs(id) on delete set null,
  traveler_id uuid references public.profiles(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  verified_identity boolean not null default false,
  verified_document boolean not null default false,
  verified_ticket boolean not null default false,
  measured_weight_kg numeric(8, 2),
  signature_path text,
  photo_paths text[] not null default '{}',
  note text,
  handed_over_by uuid references public.profiles(id) on delete set null,
  handed_over_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_sensitive boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  rollout jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists hub_inventory_one_active_location_idx
  on public.hub_inventory (shipment_id)
  where active;

create unique index if not exists hub_batch_shipments_one_active_batch_idx
  on public.hub_batch_shipments (shipment_id)
  where removed_at is null and status in ('reserved', 'picked', 'loaded');

create unique index if not exists capacity_reservations_one_active_shipment_idx
  on public.capacity_reservations (shipment_id)
  where status in ('reserved', 'loaded');

create index if not exists airport_hubs_country_idx on public.airport_hubs (country, city, is_active);
create index if not exists hub_inventory_hub_status_idx on public.hub_inventory (hub_id, status, priority, entered_at);
create index if not exists hub_inventory_destination_idx on public.hub_inventory (destination_country, destination_city);
create index if not exists hub_inventory_movements_shipment_idx on public.hub_inventory_movements (shipment_id, created_at desc);
create index if not exists hub_inbound_receipts_hub_idx on public.hub_inbound_receipts (hub_id, status, created_at desc);
create index if not exists hub_inbound_items_shipment_idx on public.hub_inbound_receipt_items (shipment_id, scanned_at desc);
create index if not exists hub_inspections_shipment_idx on public.hub_inspections (shipment_id, inspected_at desc);
create index if not exists operational_incidents_status_idx on public.operational_incidents (status, priority, created_at desc);
create index if not exists operational_incidents_hub_idx on public.operational_incidents (hub_id, status);
create index if not exists hub_batch_shipments_batch_idx on public.hub_batch_shipments (batch_id, status);
create index if not exists batch_events_batch_idx on public.batch_events (batch_id, created_at desc);

drop trigger if exists airport_hubs_set_updated_at on public.airport_hubs;
create trigger airport_hubs_set_updated_at before update on public.airport_hubs
for each row execute function public.set_updated_at();

drop trigger if exists hub_agent_profiles_set_updated_at on public.hub_agent_profiles;
create trigger hub_agent_profiles_set_updated_at before update on public.hub_agent_profiles
for each row execute function public.set_updated_at();

drop trigger if exists operations_profiles_set_updated_at on public.operations_profiles;
create trigger operations_profiles_set_updated_at before update on public.operations_profiles
for each row execute function public.set_updated_at();

drop trigger if exists hub_zones_set_updated_at on public.hub_zones;
create trigger hub_zones_set_updated_at before update on public.hub_zones
for each row execute function public.set_updated_at();

drop trigger if exists hub_aisles_set_updated_at on public.hub_aisles;
create trigger hub_aisles_set_updated_at before update on public.hub_aisles
for each row execute function public.set_updated_at();

drop trigger if exists hub_shelves_set_updated_at on public.hub_shelves;
create trigger hub_shelves_set_updated_at before update on public.hub_shelves
for each row execute function public.set_updated_at();

drop trigger if exists hub_storage_locations_set_updated_at on public.hub_storage_locations;
create trigger hub_storage_locations_set_updated_at before update on public.hub_storage_locations
for each row execute function public.set_updated_at();

drop trigger if exists hub_inventory_set_updated_at on public.hub_inventory;
create trigger hub_inventory_set_updated_at before update on public.hub_inventory
for each row execute function public.set_updated_at();

drop trigger if exists hub_inbound_receipts_set_updated_at on public.hub_inbound_receipts;
create trigger hub_inbound_receipts_set_updated_at before update on public.hub_inbound_receipts
for each row execute function public.set_updated_at();

drop trigger if exists operational_incidents_set_updated_at on public.operational_incidents;
create trigger operational_incidents_set_updated_at before update on public.operational_incidents
for each row execute function public.set_updated_at();

drop trigger if exists roles_set_updated_at on public.roles;
create trigger roles_set_updated_at before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists permissions_set_updated_at on public.permissions;
create trigger permissions_set_updated_at before update on public.permissions
for each row execute function public.set_updated_at();

alter table public.airport_hubs enable row level security;
alter table public.hub_agent_profiles enable row level security;
alter table public.operations_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.hub_zones enable row level security;
alter table public.hub_aisles enable row level security;
alter table public.hub_shelves enable row level security;
alter table public.hub_storage_locations enable row level security;
alter table public.hub_inventory enable row level security;
alter table public.hub_inventory_movements enable row level security;
alter table public.hub_inbound_receipts enable row level security;
alter table public.hub_inbound_receipt_items enable row level security;
alter table public.hub_inspections enable row level security;
alter table public.operational_incidents enable row level security;
alter table public.hub_batch_shipments enable row level security;
alter table public.batch_documents enable row level security;
alter table public.batch_events enable row level security;
alter table public.hub_handover_events enable row level security;
alter table public.system_settings enable row level security;
alter table public.feature_flags enable row level security;

create or replace function public.current_user_can_access_hub(p_hub_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
    or exists (
      select 1
      from public.hub_agent_profiles hap
      where hap.profile_id = auth.uid()
        and hap.hub_id = p_hub_id
        and hap.is_active
    )
    or exists (
      select 1
      from public.operations_profiles op
      where op.profile_id = auth.uid()
        and op.is_active
        and p_hub_id = any(op.managed_hub_ids)
    );
$$;

create or replace function public.get_numeric_system_setting(p_key text, p_default numeric)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select nullif(value #>> '{}', '')::numeric
      from public.system_settings
      where key = p_key
        and not is_sensitive
    ),
    p_default
  );
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'airport_hubs',
    'hub_agent_profiles',
    'operations_profiles',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
    'hub_zones',
    'hub_aisles',
    'hub_shelves',
    'hub_storage_locations',
    'hub_inventory',
    'hub_inventory_movements',
    'hub_inbound_receipts',
    'hub_inbound_receipt_items',
    'hub_inspections',
    'operational_incidents',
    'hub_batch_shipments',
    'batch_documents',
    'batch_events',
    'hub_handover_events',
    'system_settings',
    'feature_flags'
  ] loop
    execute format('drop policy if exists "%s_select_staff" on public.%I', v_table, v_table);
    execute format('drop policy if exists "%s_write_staff" on public.%I', v_table, v_table);
  end loop;
end $$;

create policy "airport_hubs_select_staff" on public.airport_hubs
for select using (public.current_user_has_role(array['hub_agent', 'operations_manager', 'support_agent', 'admin', 'super_admin']));
create policy "airport_hubs_write_admin" on public.airport_hubs
for all using (public.current_user_has_role(array['admin', 'super_admin']))
with check (public.current_user_has_role(array['admin', 'super_admin']));

create policy "hub_agent_profiles_select_staff" on public.hub_agent_profiles
for select using (profile_id = auth.uid() or public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin']));
create policy "hub_agent_profiles_write_admin" on public.hub_agent_profiles
for all using (public.current_user_has_role(array['admin', 'super_admin']))
with check (public.current_user_has_role(array['admin', 'super_admin']));

create policy "operations_profiles_select_staff" on public.operations_profiles
for select using (profile_id = auth.uid() or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin']));
create policy "operations_profiles_write_admin" on public.operations_profiles
for all using (public.current_user_has_role(array['admin', 'super_admin']))
with check (public.current_user_has_role(array['admin', 'super_admin']));

create policy "roles_select_staff" on public.roles
for select using (public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin']));
create policy "roles_write_staff" on public.roles
for all using (public.current_user_has_role(array['admin', 'super_admin']))
with check (public.current_user_has_role(array['admin', 'super_admin']));

create policy "permissions_select_staff" on public.permissions
for select using (public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin']));
create policy "permissions_write_staff" on public.permissions
for all using (public.current_user_has_role(array['super_admin']))
with check (public.current_user_has_role(array['super_admin']));

create policy "role_permissions_select_staff" on public.role_permissions
for select using (public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin']));
create policy "role_permissions_write_staff" on public.role_permissions
for all using (public.current_user_has_role(array['super_admin']))
with check (public.current_user_has_role(array['super_admin']));

create policy "user_roles_select_staff" on public.user_roles
for select using (
  profile_id = auth.uid()
  or public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin'])
);
create policy "user_roles_write_staff" on public.user_roles
for all using (public.current_user_has_role(array['admin', 'super_admin']))
with check (public.current_user_has_role(array['admin', 'super_admin']));

create policy "hub_zones_select_staff" on public.hub_zones for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_zones_write_staff" on public.hub_zones for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "hub_aisles_select_staff" on public.hub_aisles for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_aisles_write_staff" on public.hub_aisles for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "hub_shelves_select_staff" on public.hub_shelves for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_shelves_write_staff" on public.hub_shelves for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "hub_storage_locations_select_staff" on public.hub_storage_locations for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_storage_locations_write_staff" on public.hub_storage_locations for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "hub_inventory_select_staff" on public.hub_inventory for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_inventory_write_staff" on public.hub_inventory for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "hub_inventory_movements_select_staff" on public.hub_inventory_movements for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_inventory_movements_write_staff" on public.hub_inventory_movements for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "hub_inbound_receipts_select_staff" on public.hub_inbound_receipts for select using (public.current_user_can_access_hub(hub_id));
create policy "hub_inbound_receipts_write_staff" on public.hub_inbound_receipts for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "hub_inbound_receipt_items_select_staff" on public.hub_inbound_receipt_items
for select using (exists (
  select 1 from public.hub_inbound_receipts r
  where r.id = hub_inbound_receipt_items.receipt_id
    and public.current_user_can_access_hub(r.hub_id)
));
create policy "hub_inbound_receipt_items_write_staff" on public.hub_inbound_receipt_items
for all using (exists (
  select 1 from public.hub_inbound_receipts r
  where r.id = hub_inbound_receipt_items.receipt_id
    and public.current_user_can_access_hub(r.hub_id)
)) with check (exists (
  select 1 from public.hub_inbound_receipts r
  where r.id = hub_inbound_receipt_items.receipt_id
    and public.current_user_can_access_hub(r.hub_id)
));

create policy "hub_inspections_select_staff" on public.hub_inspections for select using (
  public.current_user_can_access_hub(hub_id)
  or public.current_user_has_role(array['support_agent', 'admin', 'super_admin'])
);
create policy "hub_inspections_write_staff" on public.hub_inspections for all using (public.current_user_can_access_hub(hub_id))
with check (public.current_user_can_access_hub(hub_id));

create policy "operational_incidents_select_staff" on public.operational_incidents for select using (
  hub_id is null
  or public.current_user_can_access_hub(hub_id)
  or public.current_user_has_role(array['support_agent', 'admin', 'super_admin'])
);
create policy "operational_incidents_write_staff" on public.operational_incidents for all using (
  hub_id is null
  or public.current_user_can_access_hub(hub_id)
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
) with check (
  hub_id is null
  or public.current_user_can_access_hub(hub_id)
  or public.current_user_has_role(array['operations_manager', 'admin', 'super_admin'])
);

create policy "hub_batch_shipments_select_staff" on public.hub_batch_shipments for select using (
  exists (
    select 1 from public.hub_batches b
    where b.id = hub_batch_shipments.batch_id
      and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id) or public.current_user_has_role(array['admin', 'super_admin']))
  )
);
create policy "hub_batch_shipments_write_staff" on public.hub_batch_shipments for all using (
  exists (
    select 1 from public.hub_batches b
    where b.id = hub_batch_shipments.batch_id
      and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id) or public.current_user_has_role(array['admin', 'super_admin']))
  )
) with check (
  exists (
    select 1 from public.hub_batches b
    where b.id = hub_batch_shipments.batch_id
      and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id) or public.current_user_has_role(array['admin', 'super_admin']))
  )
);

create policy "batch_documents_select_staff" on public.batch_documents for select using (
  exists (select 1 from public.hub_batches b where b.id = batch_documents.batch_id and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id)))
);
create policy "batch_documents_write_staff" on public.batch_documents for all using (
  exists (select 1 from public.hub_batches b where b.id = batch_documents.batch_id and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id)))
) with check (
  exists (select 1 from public.hub_batches b where b.id = batch_documents.batch_id and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id)))
);

create policy "batch_events_select_staff" on public.batch_events for select using (
  exists (select 1 from public.hub_batches b where b.id = batch_events.batch_id and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id)))
);
create policy "batch_events_write_staff" on public.batch_events for all using (
  exists (select 1 from public.hub_batches b where b.id = batch_events.batch_id and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id)))
) with check (
  exists (select 1 from public.hub_batches b where b.id = batch_events.batch_id and (b.hub_id is null or public.current_user_can_access_hub(b.hub_id)))
);

create policy "hub_handover_events_select_staff" on public.hub_handover_events for select using (
  hub_id is null or public.current_user_can_access_hub(hub_id) or traveler_id = auth.uid()
);
create policy "hub_handover_events_write_staff" on public.hub_handover_events for all using (
  hub_id is null or public.current_user_can_access_hub(hub_id)
) with check (
  hub_id is null or public.current_user_can_access_hub(hub_id)
);

create policy "system_settings_select_staff" on public.system_settings
for select using (
  (not is_sensitive and public.current_user_has_role(array['operations_manager', 'support_agent', 'admin', 'super_admin']))
  or public.current_user_has_role(array['super_admin'])
);
create policy "system_settings_write_super_admin" on public.system_settings
for all using (public.current_user_has_role(array['super_admin']))
with check (public.current_user_has_role(array['super_admin']));

create policy "feature_flags_select_staff" on public.feature_flags
for select using (public.current_user_has_role(array['operations_manager', 'admin', 'super_admin']));
create policy "feature_flags_write_super_admin" on public.feature_flags
for all using (public.current_user_has_role(array['super_admin']))
with check (public.current_user_has_role(array['super_admin']));

insert into public.system_settings (key, value, description, is_sensitive)
values
  ('hub.weight.alert_threshold_percent', '5'::jsonb, 'Alert if measured weight differs from declared weight beyond this percent.', false),
  ('hub.weight.block_threshold_percent', '15'::jsonb, 'Block or quarantine if measured weight differs beyond this percent.', false),
  ('hub.handover.pickup_qr_ttl_minutes', '45'::jsonb, 'Origin pickup QR validity window.', false)
on conflict (key) do nothing;

insert into public.roles (id, name, description, is_internal, is_critical)
values
  ('client', 'Client', 'Expediteur client Yobalelma.', false, false),
  ('local_transporter', 'Livreur local', 'Livreur national et dernier kilometre.', false, false),
  ('traveler', 'Voyageur', 'Voyageur transportant de la capacite internationale.', false, false),
  ('relay_agent', 'Agent relais', 'Agent point relais.', true, false),
  ('hub_agent', 'Agent hub', 'Agent hub logistique.', true, false),
  ('collection_driver', 'Chauffeur collecte', 'Chauffeur collecte relais vers hub.', true, false),
  ('operations_manager', 'Operations manager', 'Supervision multi-sites et interventions.', true, true),
  ('support_agent', 'Support agent', 'Consultation support et litiges.', true, false),
  ('admin', 'Admin', 'Administration plateforme.', true, true),
  ('super_admin', 'Super admin', 'Administration critique, permissions et integrations.', true, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_internal = excluded.is_internal,
  is_critical = excluded.is_critical;

insert into public.permissions (id, resource, action, description, is_critical)
values
  ('hub:read', 'hub', 'read', 'Lire les operations hub.', false),
  ('hub:write', 'hub', 'write', 'Modifier les operations hub.', false),
  ('qr:read', 'qr', 'read', 'Lire les QR operationnels.', false),
  ('qr:write', 'qr', 'write', 'Generer et scanner les QR operationnels.', false),
  ('admin:read', 'admin', 'read', 'Lire le back-office.', true),
  ('admin:write', 'admin', 'write', 'Modifier le back-office.', true),
  ('super_admin:write', 'super_admin', 'write', 'Modifier les permissions critiques.', true),
  ('shipment:read', 'shipment', 'read', 'Lire les expeditions.', false),
  ('shipment:write', 'shipment', 'write', 'Corriger ou reassigner les expeditions.', true),
  ('kyc:read', 'kyc', 'read', 'Lire les dossiers KYC.', false),
  ('kyc:review', 'kyc', 'review', 'Valider ou refuser un dossier KYC.', true),
  ('payment:read', 'payment', 'read', 'Lire les paiements.', true),
  ('payment:write', 'payment', 'write', 'Intervenir sur un paiement.', true),
  ('payout:read', 'payout', 'read', 'Lire les payouts.', true),
  ('payout:write', 'payout', 'write', 'Bloquer ou liberer un payout.', true),
  ('support:read', 'support', 'read', 'Lire les tickets support.', false),
  ('support:write', 'support', 'write', 'Traiter les tickets support.', false),
  ('dispatch:read', 'dispatch', 'read', 'Lire le dispatch.', false),
  ('dispatch:write', 'dispatch', 'write', 'Intervenir sur le dispatch.', true),
  ('operations:read', 'operations', 'read', 'Lire le centre operations.', false),
  ('operations:write', 'operations', 'write', 'Creer une action corrective.', true)
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  is_critical = excluded.is_critical;

insert into public.role_permissions (role_id, permission_id)
select role_id, permission_id
from (
  values
    ('hub_agent', 'hub:read'),
    ('hub_agent', 'hub:write'),
    ('hub_agent', 'qr:read'),
    ('hub_agent', 'qr:write'),
    ('support_agent', 'support:read'),
    ('support_agent', 'support:write'),
    ('support_agent', 'shipment:read'),
    ('support_agent', 'kyc:read'),
    ('operations_manager', 'operations:read'),
    ('operations_manager', 'operations:write'),
    ('operations_manager', 'hub:read'),
    ('operations_manager', 'dispatch:read'),
    ('operations_manager', 'dispatch:write'),
    ('operations_manager', 'shipment:read'),
    ('admin', 'admin:read'),
    ('admin', 'admin:write'),
    ('admin', 'hub:read'),
    ('admin', 'hub:write'),
    ('admin', 'shipment:read'),
    ('admin', 'shipment:write'),
    ('admin', 'kyc:review'),
    ('admin', 'payment:read'),
    ('admin', 'payout:read'),
    ('super_admin', 'super_admin:write'),
    ('super_admin', 'admin:read'),
    ('super_admin', 'admin:write')
) as seed(role_id, permission_id)
on conflict (role_id, permission_id) do nothing;

create or replace function public.move_hub_inventory(
  p_shipment_id uuid,
  p_hub_id uuid,
  p_to_location_id uuid,
  p_status public.hub_inventory_status default 'in_storage',
  p_measured_weight_kg numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inventory_id uuid;
  v_from_location_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.current_user_can_access_hub(p_hub_id) then
    raise exception 'Hub access denied';
  end if;

  if p_to_location_id is not null and not exists (
    select 1 from public.hub_storage_locations l
    where l.id = p_to_location_id
      and l.hub_id = p_hub_id
      and l.is_active
  ) then
    raise exception 'Storage location not found for hub';
  end if;

  select id, location_id
  into v_inventory_id, v_from_location_id
  from public.hub_inventory
  where shipment_id = p_shipment_id
    and active
  for update;

  if v_inventory_id is null then
    insert into public.hub_inventory (
      shipment_id,
      hub_id,
      location_id,
      status,
      measured_weight_kg,
      destination_country,
      destination_city
    )
    select
      s.id,
      p_hub_id,
      p_to_location_id,
      p_status,
      p_measured_weight_kg,
      s.destination_country,
      s.destination_city
    from public.shipments s
    where s.id = p_shipment_id
    returning id into v_inventory_id;
  else
    update public.hub_inventory
    set hub_id = p_hub_id,
        location_id = p_to_location_id,
        status = p_status,
        measured_weight_kg = coalesce(p_measured_weight_kg, measured_weight_kg),
        last_movement_at = now(),
        released_at = case when p_status = 'released' then now() else released_at end
    where id = v_inventory_id;
  end if;

  insert into public.hub_inventory_movements (
    inventory_id,
    shipment_id,
    hub_id,
    from_location_id,
    to_location_id,
    movement_type,
    scanned_by,
    note
  )
  values (
    v_inventory_id,
    p_shipment_id,
    p_hub_id,
    v_from_location_id,
    p_to_location_id,
    'move',
    auth.uid(),
    p_note
  );

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_inventory_moved',
    'shipment',
    p_shipment_id,
    jsonb_build_object('hub_id', p_hub_id, 'to_location_id', p_to_location_id, 'status', p_status)
  );

  return v_inventory_id;
end;
$$;

create or replace function public.receive_hub_manifest(
  p_hub_id uuid,
  p_manifest_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_receipt_id uuid;
  v_item jsonb;
  v_status public.hub_inbound_item_status;
  v_shipment_id uuid;
  v_tracking_code text;
  v_note text;
  v_expected integer := 0;
  v_received integer := 0;
  v_missing integer := 0;
  v_damaged integer := 0;
  v_extra integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.current_user_can_access_hub(p_hub_id) then
    raise exception 'Hub access denied';
  end if;

  insert into public.hub_inbound_receipts (
    hub_id,
    manifest_id,
    status,
    received_by,
    received_at,
    note
  )
  values (
    p_hub_id,
    p_manifest_id,
    'scanning',
    auth.uid(),
    now(),
    p_note
  )
  returning id into v_receipt_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_status := coalesce(nullif(v_item->>'status', '')::public.hub_inbound_item_status, 'received_at_hub');
    v_shipment_id := nullif(v_item->>'shipment_id', '')::uuid;
    v_tracking_code := nullif(v_item->>'tracking_code', '');
    v_note := nullif(v_item->>'note', '');

    if v_status in ('missing_at_hub', 'damaged_at_hub', 'extra_at_hub', 'quarantined', 'rejected_at_hub')
      and v_note is null then
      raise exception 'Manifest discrepancy requires a note';
    end if;

    insert into public.hub_inbound_receipt_items (
      receipt_id,
      shipment_id,
      tracking_code,
      status,
      condition_note,
      photo_paths,
      scanned_by,
      metadata
    )
    values (
      v_receipt_id,
      v_shipment_id,
      v_tracking_code,
      v_status,
      v_note,
      coalesce(
        (
          select array_agg(value)
          from jsonb_array_elements_text(coalesce(v_item->'photo_paths', '[]'::jsonb)) as value
        ),
        '{}'::text[]
      ),
      auth.uid(),
      v_item
    );

    v_expected := v_expected + case when v_status <> 'extra_at_hub' then 1 else 0 end;
    v_received := v_received + case when v_status = 'received_at_hub' then 1 else 0 end;
    v_missing := v_missing + case when v_status = 'missing_at_hub' then 1 else 0 end;
    v_damaged := v_damaged + case when v_status = 'damaged_at_hub' then 1 else 0 end;
    v_extra := v_extra + case when v_status = 'extra_at_hub' then 1 else 0 end;

    if v_shipment_id is not null and v_status in ('received_at_hub', 'damaged_at_hub', 'quarantined') then
      perform public.move_hub_inventory(
        v_shipment_id,
        p_hub_id,
        null,
        case
          when v_status = 'damaged_at_hub' then 'damaged'::public.hub_inventory_status
          when v_status = 'quarantined' then 'quarantined'::public.hub_inventory_status
          else 'inspection_required'::public.hub_inventory_status
        end,
        null,
        coalesce(v_note, 'Reception hub')
      );

      update public.shipments
      set status = 'at_hub'
      where id = v_shipment_id;

      insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
      values (
        v_shipment_id,
        auth.uid(),
        'at_hub',
        coalesce(v_note, 'Colis recu au hub.'),
        jsonb_build_object('hub_id', p_hub_id, 'receipt_id', v_receipt_id, 'hub_status', v_status)
      );
    end if;

    if v_status in ('missing_at_hub', 'damaged_at_hub', 'extra_at_hub') then
      insert into public.operational_incidents (
        incident_type,
        priority,
        hub_id,
        shipment_id,
        title,
        description,
        blocks_shipment,
        created_by,
        metadata
      )
      values (
        case
          when v_status = 'missing_at_hub' then 'missing_package'::public.operational_incident_type
          when v_status = 'damaged_at_hub' then 'damaged_package'::public.operational_incident_type
          else 'extra_package'::public.operational_incident_type
        end,
        case when v_status = 'missing_at_hub' then 'urgent'::public.operational_priority else 'high'::public.operational_priority end,
        p_hub_id,
        v_shipment_id,
        'Ecart de manifeste hub',
        coalesce(v_note, 'Ecart detecte pendant la reception hub.'),
        v_status <> 'extra_at_hub',
        auth.uid(),
        jsonb_build_object('receipt_id', v_receipt_id, 'tracking_code', v_tracking_code, 'status', v_status)
      );
    end if;
  end loop;

  update public.hub_inbound_receipts
  set expected_count = v_expected,
      received_count = v_received,
      missing_count = v_missing,
      damaged_count = v_damaged,
      extra_count = v_extra,
      status = case
        when v_missing > 0 or v_damaged > 0 or v_extra > 0 then 'needs_review'::public.hub_inbound_receipt_status
        when v_received = v_expected then 'confirmed'::public.hub_inbound_receipt_status
        else 'partially_confirmed'::public.hub_inbound_receipt_status
      end
  where id = v_receipt_id;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_manifest_received',
    'hub_inbound_receipt',
    v_receipt_id,
    jsonb_build_object('hub_id', p_hub_id, 'manifest_id', p_manifest_id, 'received', v_received, 'missing', v_missing, 'damaged', v_damaged, 'extra', v_extra)
  );

  return v_receipt_id;
end;
$$;

create or replace function public.record_hub_inspection(
  p_shipment_id uuid,
  p_hub_id uuid,
  p_measured_weight_kg numeric,
  p_decision public.hub_advanced_inspection_decision,
  p_location_id uuid default null,
  p_measured_dimensions jsonb default '{}'::jsonb,
  p_package_condition text default 'good',
  p_packaging_compliant boolean default true,
  p_note text default null,
  p_photo_paths text[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inventory_id uuid;
  v_inspection_id uuid;
  v_declared_weight numeric;
  v_variance numeric := 0;
  v_alert numeric := public.get_numeric_system_setting('hub.weight.alert_threshold_percent', 5);
  v_block numeric := public.get_numeric_system_setting('hub.weight.block_threshold_percent', 15);
  v_incident_type public.operational_incident_type;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.current_user_can_access_hub(p_hub_id) then
    raise exception 'Hub access denied';
  end if;

  select weight_kg
  into v_declared_weight
  from public.shipment_packages
  where shipment_id = p_shipment_id
  limit 1;

  if v_declared_weight is not null and v_declared_weight > 0 then
    v_variance := round(abs(p_measured_weight_kg - v_declared_weight) / v_declared_weight * 100, 2);
  end if;

  if v_variance > v_block then
    v_incident_type := 'wrong_weight';
  elsif p_decision in ('blocked', 'rejected', 'quarantined') then
    v_incident_type := 'manual_review';
  elsif not p_packaging_compliant then
    v_incident_type := 'packaging_issue';
  else
    v_incident_type := null;
  end if;

  v_inventory_id := public.move_hub_inventory(
    p_shipment_id,
    p_hub_id,
    p_location_id,
    case
      when p_decision = 'approved' then 'in_storage'::public.hub_inventory_status
      when p_decision = 'needs_repackaging' then 'inspection_required'::public.hub_inventory_status
      else 'quarantined'::public.hub_inventory_status
    end,
    p_measured_weight_kg,
    p_note
  );

  insert into public.hub_inspections (
    shipment_id,
    hub_id,
    inventory_id,
    declared_weight_kg,
    measured_weight_kg,
    measured_dimensions,
    package_condition,
    packaging_compliant,
    weight_variance_percent,
    alert_threshold_percent,
    block_threshold_percent,
    decision,
    anomaly_type,
    photo_paths,
    note,
    inspected_by
  )
  values (
    p_shipment_id,
    p_hub_id,
    v_inventory_id,
    v_declared_weight,
    p_measured_weight_kg,
    p_measured_dimensions,
    p_package_condition,
    p_packaging_compliant,
    v_variance,
    v_alert,
    v_block,
    p_decision,
    v_incident_type,
    p_photo_paths,
    p_note,
    auth.uid()
  )
  returning id into v_inspection_id;

  if v_incident_type is not null or v_variance > v_alert then
    insert into public.operational_incidents (
      incident_type,
      status,
      priority,
      hub_id,
      shipment_id,
      title,
      description,
      photo_paths,
      blocks_shipment,
      blocks_payout,
      created_by,
      metadata
    )
    values (
      coalesce(v_incident_type, 'wrong_weight'),
      case when v_variance > v_block then 'blocked'::public.operational_incident_status else 'open'::public.operational_incident_status end,
      case when v_variance > v_block then 'urgent'::public.operational_priority else 'high'::public.operational_priority end,
      p_hub_id,
      p_shipment_id,
      'Inspection hub a verifier',
      coalesce(p_note, 'Inspection avec ecart ou decision non standard.'),
      p_photo_paths,
      p_decision <> 'approved',
      p_decision in ('blocked', 'rejected', 'quarantined'),
      auth.uid(),
      jsonb_build_object('inspection_id', v_inspection_id, 'variance_percent', v_variance, 'decision', p_decision)
    );
  end if;

  insert into public.shipment_status_events (shipment_id, actor_id, status, note, metadata)
  values (
    p_shipment_id,
    auth.uid(),
    'at_hub',
    coalesce(p_note, 'Inspection hub enregistree.'),
    jsonb_build_object('inspection_id', v_inspection_id, 'decision', p_decision, 'variance_percent', v_variance)
  );

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_inspection_recorded',
    'shipment',
    p_shipment_id,
    jsonb_build_object('inspection_id', v_inspection_id, 'hub_id', p_hub_id, 'decision', p_decision)
  );

  return v_inspection_id;
end;
$$;

create or replace function public.reserve_hub_batch_capacity_v2(
  p_batch_id uuid,
  p_shipment_id uuid,
  p_reserved_weight_kg numeric default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_batch public.hub_batches%rowtype;
  v_shipment public.shipments%rowtype;
  v_trip public.trips%rowtype;
  v_weight numeric;
  v_total numeric;
  v_reservation_id uuid;
  v_inventory_id uuid;
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

  if v_batch.hub_id is not null and not public.current_user_can_access_hub(v_batch.hub_id) then
    raise exception 'Hub access denied';
  end if;

  if v_batch.status not in ('open') then
    raise exception 'Batch cannot accept more shipments';
  end if;

  select *
  into v_shipment
  from public.shipments
  where id = p_shipment_id
  for update;

  if v_shipment.id is null then
    raise exception 'Shipment not found';
  end if;

  if v_batch.destination_country is not null
    and lower(v_batch.destination_country) <> lower(v_shipment.destination_country) then
    raise exception 'Shipment destination is incompatible with batch';
  end if;

  if v_batch.trip_id is not null then
    select *
    into v_trip
    from public.trips
    where id = v_batch.trip_id
    for update;

    if v_trip.id is null or v_trip.status not in ('planned', 'boarding') then
      raise exception 'Trip is not available for reservation';
    end if;

    if lower(v_trip.destination_country) <> lower(v_shipment.destination_country) then
      raise exception 'Trip destination is incompatible with shipment';
    end if;
  end if;

  if exists (
    select 1
    from public.hub_batch_shipments hbs
    where hbs.shipment_id = p_shipment_id
      and hbs.removed_at is null
      and hbs.status in ('reserved', 'picked', 'loaded')
      and hbs.batch_id <> p_batch_id
    for update
  ) then
    raise exception 'Shipment already belongs to another active batch';
  end if;

  select coalesce(measured_weight_kg, null)
  into v_weight
  from public.hub_inventory
  where shipment_id = p_shipment_id
    and active
  order by updated_at desc
  limit 1;

  if v_weight is null then
    select weight_kg into v_weight
    from public.shipment_packages
    where shipment_id = p_shipment_id
    limit 1;
  end if;

  v_weight := coalesce(p_reserved_weight_kg, v_weight);

  if v_weight is null or v_weight <= 0 then
    raise exception 'Reserved weight is required';
  end if;

  select coalesce(sum(reserved_weight_kg), 0)
  into v_total
  from public.hub_batch_shipments
  where batch_id = p_batch_id
    and removed_at is null
    and status in ('reserved', 'picked', 'loaded');

  if v_total + v_weight > v_batch.capacity_kg then
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
    v_weight,
    'reserved',
    auth.uid()
  )
  on conflict (batch_id, shipment_id) do update set
    reserved_weight_kg = excluded.reserved_weight_kg,
    status = 'reserved',
    updated_at = now()
  returning id into v_reservation_id;

  select id
  into v_inventory_id
  from public.hub_inventory
  where shipment_id = p_shipment_id
    and active
  limit 1;

  insert into public.hub_batch_shipments (
    batch_id,
    shipment_id,
    inventory_id,
    reserved_weight_kg,
    status,
    added_by
  )
  values (
    p_batch_id,
    p_shipment_id,
    v_inventory_id,
    v_weight,
    'reserved',
    auth.uid()
  )
  on conflict (batch_id, shipment_id) do update set
    reserved_weight_kg = excluded.reserved_weight_kg,
    status = 'reserved',
    removed_at = null;

  update public.hub_inventory
  set status = 'reserved_for_batch',
      current_batch_id = p_batch_id,
      last_movement_at = now()
  where shipment_id = p_shipment_id
    and active;

  update public.hub_batches
  set reserved_weight_kg = (
        select coalesce(sum(reserved_weight_kg), 0)
        from public.hub_batch_shipments
        where batch_id = p_batch_id
          and removed_at is null
          and status in ('reserved', 'picked', 'loaded')
      ),
      qr_payload = coalesce(qr_payload, '{}'::jsonb) || jsonb_build_object('last_reservation_id', v_reservation_id)
  where id = p_batch_id;

  insert into public.batch_events (batch_id, actor_id, event_type, note, metadata)
  values (
    p_batch_id,
    auth.uid(),
    'capacity_reserved',
    'Shipment reserved in hub batch.',
    jsonb_build_object('shipment_id', p_shipment_id, 'reservation_id', v_reservation_id, 'weight_kg', v_weight)
  );

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_batch_capacity_reserved',
    'hub_batch',
    p_batch_id,
    jsonb_build_object('shipment_id', p_shipment_id, 'reservation_id', v_reservation_id, 'weight_kg', v_weight)
  );

  return v_reservation_id;
end;
$$;

create or replace function public.create_hub_incident(
  p_incident_type public.operational_incident_type,
  p_title text,
  p_description text default null,
  p_hub_id uuid default null,
  p_shipment_id uuid default null,
  p_batch_id uuid default null,
  p_priority public.operational_priority default 'medium',
  p_blocks_payout boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_incident_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_hub_id is not null and not public.current_user_can_access_hub(p_hub_id) then
    raise exception 'Hub access denied';
  end if;

  insert into public.operational_incidents (
    incident_type,
    title,
    description,
    hub_id,
    shipment_id,
    batch_id,
    priority,
    blocks_payout,
    blocks_shipment,
    blocks_batch,
    created_by
  )
  values (
    p_incident_type,
    p_title,
    p_description,
    p_hub_id,
    p_shipment_id,
    p_batch_id,
    p_priority,
    p_blocks_payout,
    p_shipment_id is not null,
    p_batch_id is not null,
    auth.uid()
  )
  returning id into v_incident_id;

  if p_blocks_payout and p_shipment_id is not null then
    update public.shipments
    set payout_eligible_for_release = false,
        payout_blocked_reason = p_incident_type::text
    where id = p_shipment_id;
  end if;

  if p_batch_id is not null then
    update public.hub_batches
    set anomaly_count = anomaly_count + 1
    where id = p_batch_id;
  end if;

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_incident_created',
    'operational_incident',
    v_incident_id,
    jsonb_build_object('type', p_incident_type, 'hub_id', p_hub_id, 'shipment_id', p_shipment_id, 'batch_id', p_batch_id)
  );

  return v_incident_id;
end;
$$;

create or replace function public.record_hub_handover_event(
  p_batch_id uuid,
  p_token_id uuid default null,
  p_verified_identity boolean default false,
  p_verified_document boolean default false,
  p_verified_ticket boolean default false,
  p_measured_weight_kg numeric default null,
  p_signature_path text default null,
  p_photo_paths text[] default '{}',
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_batch public.hub_batches%rowtype;
  v_event_id uuid;
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

  if v_batch.hub_id is not null and not public.current_user_can_access_hub(v_batch.hub_id) then
    raise exception 'Hub access denied';
  end if;

  if not (p_verified_identity and p_verified_document and p_verified_ticket) then
    raise exception 'Identity, document and ticket verifications are required';
  end if;

  insert into public.hub_handover_events (
    batch_id,
    token_id,
    hub_id,
    traveler_id,
    trip_id,
    verified_identity,
    verified_document,
    verified_ticket,
    measured_weight_kg,
    signature_path,
    photo_paths,
    note,
    handed_over_by
  )
  values (
    p_batch_id,
    p_token_id,
    v_batch.hub_id,
    v_batch.traveler_id,
    v_batch.trip_id,
    p_verified_identity,
    p_verified_document,
    p_verified_ticket,
    p_measured_weight_kg,
    p_signature_path,
    p_photo_paths,
    p_note,
    auth.uid()
  )
  returning id into v_event_id;

  update public.hub_batches
  set status = 'in_transit',
      sealed_by = coalesce(sealed_by, auth.uid()),
      sealed_at = coalesce(sealed_at, now())
  where id = p_batch_id;

  update public.hub_batch_shipments
  set status = 'loaded'
  where batch_id = p_batch_id
    and removed_at is null;

  update public.hub_inventory
  set status = 'handed_over',
      active = false,
      released_at = now(),
      last_movement_at = now()
  where current_batch_id = p_batch_id
    and active;

  insert into public.batch_events (batch_id, actor_id, event_type, note, metadata)
  values (
    p_batch_id,
    auth.uid(),
    'handed_over_to_traveler',
    coalesce(p_note, 'Batch handed over to traveler.'),
    jsonb_build_object('handover_event_id', v_event_id)
  );

  insert into public.audit_log_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'hub_batch_handed_over',
    'hub_batch',
    p_batch_id,
    jsonb_build_object('handover_event_id', v_event_id, 'token_id', p_token_id)
  );

  return v_event_id;
end;
$$;

create or replace view public.hub_control_center_daily as
select
  h.id as hub_id,
  h.code as hub_code,
  h.name as hub_name,
  count(i.id) filter (where i.status = 'received') as received_packages,
  count(i.id) filter (where i.status = 'inspection_required') as packages_to_inspect,
  count(i.id) filter (where i.status = 'in_storage') as packages_in_storage,
  count(i.id) filter (where i.location_id is null and i.active) as packages_without_location,
  count(i.id) filter (where i.status = 'reserved_for_batch') as packages_reserved,
  coalesce(sum(i.measured_weight_kg) filter (where i.active), 0) as total_stock_weight_kg,
  count(inc.id) filter (where inc.status in ('open', 'assigned', 'escalated', 'blocked')) as open_incidents
from public.airport_hubs h
left join public.hub_inventory i on i.hub_id = h.id
left join public.operational_incidents inc on inc.hub_id = h.id
group by h.id, h.code, h.name;

insert into public.airport_hubs (code, name, country, city, airport_code, timezone, max_daily_packages, max_storage_weight_kg)
values
  ('CDG-PARIS', 'Paris CDG Hub', 'France', 'Paris', 'CDG', 'Europe/Paris', 500, 5000),
  ('DSS-DAKAR', 'Dakar DSS Hub', 'Senegal', 'Dakar', 'DSS', 'Africa/Dakar', 500, 5000)
on conflict (code) do nothing;
