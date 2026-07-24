alter table public.relay_points
  alter column contact_name drop not null,
  alter column contact_phone drop not null,
  add column if not exists external_provider text,
  add column if not exists external_id text,
  add column if not exists partner_name text,
  add column if not exists latitude double precision check (latitude between -90 and 90),
  add column if not exists longitude double precision check (longitude between -180 and 180),
  add column if not exists opening_hours jsonb not null default '{}'::jsonb,
  add column if not exists services jsonb not null default '[]'::jsonb,
  add column if not exists availability text not null default 'unknown' check (availability in ('available', 'limited', 'unavailable', 'unknown')),
  add column if not exists external_updated_at timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists source_hash text;

create unique index if not exists relay_points_external_provider_id_idx
  on public.relay_points (external_provider, external_id);

create index if not exists relay_points_coordinates_idx on public.relay_points (country, city, latitude, longitude) where status = 'active';

create table if not exists public.partner_location_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('orange')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  full_snapshot boolean not null default false,
  imported_count integer not null default 0 check (imported_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  deactivated_count integer not null default 0 check (deactivated_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
);

alter table public.partner_location_sync_runs enable row level security;

create policy "partner_location_sync_runs_select_authorized" on public.partner_location_sync_runs
for select using (public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','operations_manager','auditor','admin','super_admin']));

create policy "partner_location_sync_runs_insert_authorized" on public.partner_location_sync_runs
for insert with check (created_by = auth.uid() and public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']));

create policy "partner_location_sync_runs_update_authorized" on public.partner_location_sync_runs
for update using (created_by = auth.uid() and public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']))
with check (created_by = auth.uid() and public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']));

create policy "relay_points_partner_sync_update" on public.relay_points
for update using (public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']))
with check (public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']));

create policy "relay_points_partner_sync_insert" on public.relay_points
for insert with check (public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']));

create or replace function public.protect_partner_relay_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (new.external_provider is not null or old.external_provider is not null)
     and (new.external_provider is distinct from old.external_provider
      or new.external_id is distinct from old.external_id
      or new.partner_name is distinct from old.partner_name
      or new.name is distinct from old.name
      or new.contact_name is distinct from old.contact_name
      or new.contact_phone is distinct from old.contact_phone
      or new.address_line1 is distinct from old.address_line1
      or new.city is distinct from old.city
      or new.country is distinct from old.country
      or new.postal_code is distinct from old.postal_code
      or new.capacity_slots is distinct from old.capacity_slots
      or new.status is distinct from old.status
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude
      or new.opening_hours is distinct from old.opening_hours
      or new.services is distinct from old.services
      or new.availability is distinct from old.availability
      or new.external_updated_at is distinct from old.external_updated_at
      or new.last_synced_at is distinct from old.last_synced_at
      or new.source_hash is distinct from old.source_hash)
     and not public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']) then
    raise exception 'Partner relay fields require an authorized partnership role';
  end if;
  return new;
end;
$$;

drop trigger if exists relay_points_protect_partner_fields on public.relay_points;
create trigger relay_points_protect_partner_fields
before update on public.relay_points
for each row execute function public.protect_partner_relay_fields();

create or replace function public.protect_partner_relay_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.external_provider is not null
     and not public.current_user_has_role(array['partner_manager','orange_partner_manager','relay_partner_manager','admin','super_admin']) then
    raise exception 'Partner relay creation requires an authorized partnership role';
  end if;
  return new;
end;
$$;

drop trigger if exists relay_points_protect_partner_insert on public.relay_points;
create trigger relay_points_protect_partner_insert
before insert on public.relay_points
for each row execute function public.protect_partner_relay_insert();
