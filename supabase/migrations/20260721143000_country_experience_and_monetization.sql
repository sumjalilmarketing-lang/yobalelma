-- Expérience pays et monétisation contrôlée Yobalelma.
-- Les espaces opérationnels internes sont volontairement exclus des placements.

create table if not exists public.country_experience_configs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  default_locale text not null,
  available_locales text[] not null default '{}',
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  time_zone text not null,
  unit_system text not null default 'metric' check (unit_system in ('metric','imperial')),
  local_accent text,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  published_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  published_at timestamptz,
  unique (country_code, version),
  check (jsonb_typeof(settings) = 'object')
);

create unique index if not exists country_experience_one_published
  on public.country_experience_configs(country_code) where status = 'published';

create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','suspended','archived')),
  allowed_domains text[] not null default '{}',
  billing_country text check (billing_country is null or billing_country ~ '^[A-Z]{2}$'),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  surface text not null check (surface in ('user_app','website','mobile_app')),
  route_pattern text not null,
  format text not null check (format in ('premium_banner','sponsored_card','partner_carousel','local_offer','partner_content')),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete restrict,
  name text not null,
  status text not null default 'draft' check (status in ('draft','submitted','in_review','approved','scheduled','active','suspended','rejected','completed','archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  budget_minor bigint not null default 0 check (budget_minor >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  country_codes text[] not null default '{}',
  region_codes text[] not null default '{}',
  city_codes text[] not null default '{}',
  locales text[] not null default '{}',
  user_types text[] not null default '{}',
  shipment_types text[] not null default '{}',
  corridor_codes text[] not null default '{}',
  device_types text[] not null default '{}',
  partner_codes text[] not null default '{}',
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  placement_id uuid not null references public.ad_placements(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','submitted','in_review','approved','rejected','suspended','archived')),
  headline text not null check (char_length(headline) between 2 and 90),
  body text not null check (char_length(body) between 2 and 240),
  cta_label text not null check (char_length(cta_label) between 2 and 40),
  destination_url text not null check (destination_url ~ '^https://'),
  image_url text check (image_url is null or image_url ~ '^https://'),
  alt_text text check (alt_text is null or char_length(alt_text) <= 180),
  moderation_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_events (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  placement_id uuid not null references public.ad_placements(id) on delete restrict,
  event_type text not null check (event_type in ('impression','click','conversion')),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  locale text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.ad_change_log (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('advertiser','campaign','creative','placement','country_experience')),
  entity_id uuid not null,
  action text not null,
  actor_id uuid references auth.users(id),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(summary) = 'object')
);

alter table public.country_experience_configs enable row level security;
alter table public.advertisers enable row level security;
alter table public.ad_placements enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.ad_events enable row level security;
alter table public.ad_change_log enable row level security;

drop policy if exists country_experience_public_read on public.country_experience_configs;
create policy country_experience_public_read on public.country_experience_configs for select
using (status = 'published' or public.current_user_has_role(array['super_admin','admin','country_manager']));
drop policy if exists country_experience_manage on public.country_experience_configs;
create policy country_experience_manage on public.country_experience_configs for all to authenticated
using (public.current_user_has_role(array['super_admin','admin','country_manager']))
with check (public.current_user_has_role(array['super_admin','admin','country_manager']));

drop policy if exists monetization_manage_advertisers on public.advertisers;
create policy monetization_manage_advertisers on public.advertisers for all to authenticated
using (public.current_user_has_role(array['super_admin','admin','partner_manager']))
with check (public.current_user_has_role(array['super_admin','admin','partner_manager']));
drop policy if exists monetization_manage_placements on public.ad_placements;
create policy monetization_manage_placements on public.ad_placements for all to authenticated
using (public.current_user_has_role(array['super_admin','admin','partner_manager']))
with check (public.current_user_has_role(array['super_admin','admin','partner_manager']));
drop policy if exists monetization_public_placements on public.ad_placements;
create policy monetization_public_placements on public.ad_placements for select
using (enabled and surface in ('user_app','website','mobile_app'));
drop policy if exists monetization_manage_campaigns on public.ad_campaigns;
create policy monetization_manage_campaigns on public.ad_campaigns for all to authenticated
using (public.current_user_has_role(array['super_admin','admin','partner_manager']))
with check (public.current_user_has_role(array['super_admin','admin','partner_manager']));
drop policy if exists monetization_public_campaigns on public.ad_campaigns;
create policy monetization_public_campaigns on public.ad_campaigns for select
using (status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
drop policy if exists monetization_manage_creatives on public.ad_creatives;
create policy monetization_manage_creatives on public.ad_creatives for all to authenticated
using (public.current_user_has_role(array['super_admin','admin','partner_manager']))
with check (public.current_user_has_role(array['super_admin','admin','partner_manager']));
drop policy if exists monetization_public_creatives on public.ad_creatives;
create policy monetization_public_creatives on public.ad_creatives for select
using (
  status = 'approved' and exists (
    select 1 from public.ad_campaigns c
    where c.id = campaign_id and c.status = 'active'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now())
  )
);
drop policy if exists monetization_manage_events on public.ad_events;
create policy monetization_manage_events on public.ad_events for select to authenticated
using (public.current_user_has_role(array['super_admin','admin','partner_manager']));
drop policy if exists monetization_record_events on public.ad_events;
create policy monetization_record_events on public.ad_events for insert
with check (
  exists (
    select 1 from public.ad_campaigns c
    join public.ad_creatives cr on cr.campaign_id = c.id
    join public.ad_placements p on p.id = cr.placement_id
    where c.id = campaign_id and cr.id = creative_id and p.id = placement_id
      and c.status = 'active' and cr.status = 'approved' and p.enabled
      and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at > now())
  )
);
drop policy if exists monetization_manage_log on public.ad_change_log;
create policy monetization_manage_log on public.ad_change_log for select to authenticated
using (public.current_user_has_role(array['super_admin','admin','partner_manager','auditor']));

create or replace function public.enforce_ad_campaign_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved','scheduled','active') and old.status is distinct from new.status then
    if auth.role() <> 'service_role' and not public.current_user_has_role(array['super_admin','admin']) then
      raise exception 'CAMPAIGN_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    if auth.uid() is not null and new.created_by = auth.uid() then
      raise exception 'INDEPENDENT_REVIEW_REQUIRED' using errcode = '42501';
    end if;
    new.approved_by := auth.uid();
  end if;
  return new;
end;
$$;
drop trigger if exists ad_campaign_review_guard on public.ad_campaigns;
create trigger ad_campaign_review_guard before update on public.ad_campaigns
for each row execute function public.enforce_ad_campaign_review();

insert into public.ad_placements (code, label, surface, route_pattern, format, enabled) values
  ('user.home.partner', 'Accueil · partenaire', 'user_app', '/', 'sponsored_card', false),
  ('user.discovery.offer', 'Découverte · offre locale', 'user_app', '/discover', 'local_offer', false),
  ('website.home.banner', 'Site · bannière d’accueil', 'website', '/', 'premium_banner', false)
on conflict (code) do nothing;
