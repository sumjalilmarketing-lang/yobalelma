create extension if not exists pgcrypto;

create or replace function public.yobalelma_random_bytes(p_length integer)
returns bytea
language sql
volatile
set search_path = public, extensions, pg_catalog
as $$
  select gen_random_bytes(p_length);
$$;

create type public.user_role as enum ('sender', 'traveler', 'both', 'admin');
create type public.parcel_status as enum ('draft', 'open', 'matched', 'in_transit', 'delivered', 'cancelled');
create type public.trip_status as enum ('planned', 'boarding', 'arrived', 'cancelled');
create type public.offer_status as enum ('pending', 'accepted', 'declined', 'cancelled');
create type public.tracking_event_type as enum ('created', 'matched', 'picked_up', 'in_transit', 'delivered', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  city text,
  country text,
  role public.user_role not null default 'sender',
  preferred_language text not null default 'fr',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parcel_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  origin_city text not null,
  origin_country text not null,
  destination_city text not null,
  destination_country text not null,
  package_type text not null,
  weight_kg numeric(8, 2) not null check (weight_kg > 0 and weight_kg <= 50),
  deadline date not null,
  description text not null,
  declared_value_cents integer not null default 0 check (declared_value_cents >= 0),
  status public.parcel_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  origin_city text not null,
  origin_country text not null,
  destination_city text not null,
  destination_country text not null,
  departure_date date not null,
  arrival_date date not null,
  available_weight_kg numeric(8, 2) not null check (available_weight_kg > 0 and available_weight_kg <= 80),
  notes text,
  status public.trip_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_dates_check check (arrival_date >= departure_date)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  parcel_request_id uuid not null references public.parcel_requests(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  message text,
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parcel_request_id, trip_id)
);

create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  parcel_request_id uuid not null references public.parcel_requests(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  event_type public.tracking_event_type not null,
  note text,
  created_at timestamptz not null default now()
);

create index parcel_requests_route_idx on public.parcel_requests (origin_country, destination_country, status);
create index parcel_requests_sender_idx on public.parcel_requests (sender_id, created_at desc);
create index trips_route_idx on public.trips (origin_country, destination_country, status, departure_date);
create index trips_traveler_idx on public.trips (traveler_id, departure_date);
create index offers_parcel_idx on public.offers (parcel_request_id, status);
create index offers_traveler_idx on public.offers (traveler_id, status);
create index tracking_events_parcel_idx on public.tracking_events (parcel_request_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger parcel_requests_set_updated_at
before update on public.parcel_requests
for each row execute function public.set_updated_at();

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.parcel_requests enable row level security;
alter table public.trips enable row level security;
alter table public.offers enable row level security;
alter table public.tracking_events enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "parcel_requests_select_visible" on public.parcel_requests
for select using (auth.uid() = sender_id or status in ('open', 'matched'));

create policy "parcel_requests_insert_own" on public.parcel_requests
for insert with check (auth.uid() = sender_id);

create policy "parcel_requests_update_own" on public.parcel_requests
for update using (auth.uid() = sender_id) with check (auth.uid() = sender_id);

create policy "trips_select_visible" on public.trips
for select using (auth.uid() = traveler_id or status in ('planned', 'boarding'));

create policy "trips_insert_own" on public.trips
for insert with check (auth.uid() = traveler_id);

create policy "trips_update_own" on public.trips
for update using (auth.uid() = traveler_id) with check (auth.uid() = traveler_id);

create policy "offers_select_participants" on public.offers
for select using (
  auth.uid() = traveler_id
  or exists (
    select 1 from public.parcel_requests p
    where p.id = offers.parcel_request_id and p.sender_id = auth.uid()
  )
);

create policy "offers_insert_traveler" on public.offers
for insert with check (auth.uid() = traveler_id);

create policy "offers_update_participants" on public.offers
for update using (
  auth.uid() = traveler_id
  or exists (
    select 1 from public.parcel_requests p
    where p.id = offers.parcel_request_id and p.sender_id = auth.uid()
  )
) with check (
  auth.uid() = traveler_id
  or exists (
    select 1 from public.parcel_requests p
    where p.id = offers.parcel_request_id and p.sender_id = auth.uid()
  )
);

create policy "tracking_events_select_participants" on public.tracking_events
for select using (
  auth.uid() = actor_id
  or exists (
    select 1 from public.parcel_requests p
    where p.id = tracking_events.parcel_request_id and p.sender_id = auth.uid()
  )
  or exists (
    select 1 from public.offers o
    where o.parcel_request_id = tracking_events.parcel_request_id and o.traveler_id = auth.uid()
  )
);

create policy "tracking_events_insert_participants" on public.tracking_events
for insert with check (
  auth.uid() = actor_id
  and (
    exists (
      select 1 from public.parcel_requests p
      where p.id = tracking_events.parcel_request_id and p.sender_id = auth.uid()
    )
    or exists (
      select 1 from public.offers o
      where o.parcel_request_id = tracking_events.parcel_request_id and o.traveler_id = auth.uid()
    )
  )
);
