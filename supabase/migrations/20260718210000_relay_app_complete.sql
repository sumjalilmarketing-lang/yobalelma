-- Relay App: point-scoped inventory, storage, controls and handovers.
create table if not exists public.relay_point_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relay_point_id uuid not null references public.relay_points(id) on delete cascade,
  role text not null check (role in ('relay_agent','relay_manager','operations_manager')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(profile_id, relay_point_id)
);

create table if not exists public.relay_storage_locations (
  id uuid primary key default gen_random_uuid(), relay_point_id uuid not null references public.relay_points(id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9-]{2,24}$'), kind text not null check (kind in ('shelf','locker','secure_cage','oversize')),
  zone text not null, capacity integer not null check (capacity > 0), max_weight_kg numeric(10,2) not null check (max_weight_kg > 0),
  status text not null default 'available' check (status in ('available','near_capacity','full','maintenance')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(relay_point_id, code)
);

alter table public.relay_inventory add column if not exists storage_location_id uuid references public.relay_storage_locations(id) on delete set null;
alter table public.relay_inventory add column if not exists quality_score integer check (quality_score between 0 and 100);
alter table public.relay_inventory add column if not exists due_at timestamptz;

create table if not exists public.relay_package_controls (
  id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.shipments(id) on delete cascade,
  relay_point_id uuid not null references public.relay_points(id) on delete cascade, actor_id uuid not null references public.profiles(id) on delete restrict,
  weight_kg numeric(10,2) not null check (weight_kg > 0 and weight_kg <= 300), dimensions jsonb not null,
  quality_score integer not null check (quality_score between 0 and 100), photo_count integer not null default 0 check (photo_count between 0 and 20),
  decision text not null check (decision in ('accepted','refused','anomaly')), idempotency_key text not null,
  created_at timestamptz not null default now(), unique(actor_id,idempotency_key)
);

create table if not exists public.relay_handover_events (
  id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.shipments(id) on delete cascade,
  relay_point_id uuid not null references public.relay_points(id) on delete cascade, actor_id uuid not null references public.profiles(id) on delete restrict,
  recipient_type text not null check (recipient_type in ('internal_carrier','recipient')), otp_verified boolean not null default false,
  signature_hash text not null check (length(signature_hash) between 32 and 256), quantity integer not null default 1 check (quantity > 0),
  idempotency_key text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(actor_id,idempotency_key)
);

create table if not exists public.relay_offline_operations (
  id uuid primary key default gen_random_uuid(), relay_point_id uuid not null references public.relay_points(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade, idempotency_key text not null,
  operation_type text not null, payload jsonb not null default '{}'::jsonb, status text not null default 'processed' check(status in ('processed','conflict','rejected')),
  created_at timestamptz not null default now(), unique(actor_id,idempotency_key)
);

create index if not exists relay_members_profile_idx on public.relay_point_members(profile_id,active);
create index if not exists relay_locations_point_idx on public.relay_storage_locations(relay_point_id,status);
create index if not exists relay_controls_point_idx on public.relay_package_controls(relay_point_id,created_at desc);
create index if not exists relay_handovers_point_idx on public.relay_handover_events(relay_point_id,created_at desc);

create or replace function public.current_user_can_access_relay_point(p_relay_point_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and (exists(select 1 from public.relay_point_members m where m.profile_id=auth.uid() and m.relay_point_id=p_relay_point_id and m.active)
    or public.current_user_has_role(array['operations_manager','admin','super_admin']));
$$;
revoke all on function public.current_user_can_access_relay_point(uuid) from public;
grant execute on function public.current_user_can_access_relay_point(uuid) to authenticated;

alter table public.relay_point_members enable row level security;
alter table public.relay_storage_locations enable row level security;
alter table public.relay_package_controls enable row level security;
alter table public.relay_handover_events enable row level security;
alter table public.relay_offline_operations enable row level security;

create policy "relay_members_scoped_select" on public.relay_point_members for select using (profile_id=auth.uid() or public.current_user_has_role(array['operations_manager','admin','super_admin']));
create policy "relay_members_managed" on public.relay_point_members for all using (public.current_user_has_role(array['operations_manager','admin','super_admin'])) with check (public.current_user_has_role(array['operations_manager','admin','super_admin']));
create policy "relay_locations_scoped_select" on public.relay_storage_locations for select using (public.current_user_can_access_relay_point(relay_point_id));
create policy "relay_locations_scoped_write" on public.relay_storage_locations for all using (public.current_user_can_access_relay_point(relay_point_id) and public.current_user_has_role(array['relay_manager','operations_manager','admin','super_admin'])) with check (public.current_user_can_access_relay_point(relay_point_id) and public.current_user_has_role(array['relay_manager','operations_manager','admin','super_admin']));
create policy "relay_controls_scoped" on public.relay_package_controls for all using (public.current_user_can_access_relay_point(relay_point_id)) with check (actor_id=auth.uid() and public.current_user_can_access_relay_point(relay_point_id));
create policy "relay_handovers_scoped" on public.relay_handover_events for all using (public.current_user_can_access_relay_point(relay_point_id)) with check (actor_id=auth.uid() and public.current_user_can_access_relay_point(relay_point_id));
create policy "relay_offline_scoped" on public.relay_offline_operations for all using (actor_id=auth.uid() and public.current_user_can_access_relay_point(relay_point_id)) with check (actor_id=auth.uid() and public.current_user_can_access_relay_point(relay_point_id));

create or replace function public.record_relay_handover(p_tracking_code text,p_relay_point_id uuid,p_recipient_type text,p_otp_verified boolean,p_signature_hash text,p_idempotency_key text,p_metadata jsonb default '{}'::jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_shipment uuid;v_event uuid;
begin
 if not public.current_user_can_access_relay_point(p_relay_point_id) or not public.current_user_has_role(array['relay_agent','relay_manager','operations_manager','admin','super_admin']) then raise exception 'Relay access denied'; end if;
 if p_recipient_type not in ('internal_carrier','recipient') then raise exception 'Invalid recipient type'; end if;
 if p_recipient_type='recipient' and not p_otp_verified then raise exception 'OTP required'; end if;
 if length(p_signature_hash)<32 then raise exception 'Invalid signature'; end if;
 select id into v_shipment from public.shipments where tracking_code=p_tracking_code;
 if v_shipment is null then raise exception 'Shipment not found'; end if;
 insert into public.relay_handover_events(shipment_id,relay_point_id,actor_id,recipient_type,otp_verified,signature_hash,idempotency_key,metadata)
 values(v_shipment,p_relay_point_id,auth.uid(),p_recipient_type,p_otp_verified,p_signature_hash,p_idempotency_key,p_metadata)
 on conflict(actor_id,idempotency_key) do update set metadata=relay_handover_events.metadata returning id into v_event;
 update public.relay_inventory set status='released',checked_out_at=now(),updated_by=auth.uid(),updated_at=now() where shipment_id=v_shipment and current_relay_point_id=p_relay_point_id;
 return v_event;
end $$;
revoke all on function public.record_relay_handover(text,uuid,text,boolean,text,text,jsonb) from public;
grant execute on function public.record_relay_handover(text,uuid,text,boolean,text,text,jsonb) to authenticated;
